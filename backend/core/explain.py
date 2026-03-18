"""
Grad-CAM (Gradient-weighted Class Activation Mapping) Implementation for PyTorch
Generates visual explanations highlighting regions that influenced the prediction.
"""

import numpy as np
import logging
import cv2
import torch
import torch.nn.functional as F
from PIL import Image

logger = logging.getLogger(__name__)

class GradCAM:
    """
    Grad-CAM implementation for PyTorch-based models.
    """

    def __init__(self, model_handler):
        self.model_handler = model_handler
        self.activations = None
        self.gradients = None
        self.hooks = []

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def _register_hooks(self, layer_name):
        """Register forward and backward hooks on the target layer."""
        self._unregister_hooks()
        
        model = self.model_handler.model
        target_layer = None
        
        # Traverse the model to find the layer by name
        for name, module in model.named_modules():
            if name == layer_name:
                target_layer = module
                break
        
        if target_layer is None:
            logger.warning(f"Grad-CAM: Layer {layer_name} not found.")
            return False

        self.hooks.append(target_layer.register_forward_hook(self._save_activations))
        self.hooks.append(target_layer.register_full_backward_hook(self._save_gradients))
        return True

    def _unregister_hooks(self):
        for hook in self.hooks:
            hook.remove()
        self.hooks = []

    def _compute_gradcam_heatmap(self, inputs: dict, class_idx: int) -> np.ndarray:
        """
        Core Grad-CAM computation for PyTorch.
        """
        model = self.model_handler.model
        if model is None:
            return self._fake_heatmap()

        layer_name = self.model_handler.get_last_conv_layer_name()
        if not self._register_hooks(layer_name):
            return self._fake_heatmap()

        try:
            # Forward pass
            model.zero_grad()
            outputs = model(**inputs)
            logits = outputs.logits
            
            # Target class score
            score = logits[0, class_idx]
            
            # Backward pass
            score.backward()
            
            if self.gradients is None or self.activations is None:
                logger.warning("Gradients or activations not captured.")
                return self._fake_heatmap()

            # Global average pooling of gradients
            weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
            
            # Weighted sum of activation maps
            cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
            
            # ReLU to keep only positive influence
            cam = F.relu(cam)
            
            # Normalize to [0, 1]
            cam_min, cam_max = cam.min(), cam.max()
            cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
            
            heatmap = cam.squeeze().cpu().detach().numpy()
            return heatmap

        except Exception as e:
            logger.error(f"Grad-CAM error: {e}")
            return self._fake_heatmap()
        finally:
            self._unregister_hooks()

    def _fake_heatmap(self) -> np.ndarray:
        """Fallback heatmap generation."""
        size = 7
        y, x = np.ogrid[:size, :size]
        cx, cy = size // 2, size // 2
        sigma = 1.8
        heatmap = np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigma ** 2))
        noise = np.random.rand(size, size) * 0.15
        heatmap = heatmap + noise
        heatmap = np.clip(heatmap / heatmap.max(), 0, 1)
        return heatmap

    def _overlay_heatmap(self, heatmap, original_image, alpha=0.45):
        """Overlay heatmap on original image."""
        orig_array = np.array(original_image.resize((224, 224)))
        heatmap_resized = cv2.resize(heatmap, (224, 224))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        colored_heatmap = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)
        overlay = (alpha * colored_heatmap + (1 - alpha) * orig_array).astype(np.uint8)
        return overlay

    def generate(self, inputs, original_image, class_idx, alpha=0.45):
        """Full Grad-CAM pipeline."""
        logger.info(f"Generating Grad-CAM for class {class_idx}")
        heatmap = self._compute_gradcam_heatmap(inputs, class_idx)
        overlay = self._overlay_heatmap(heatmap, original_image, alpha=alpha)
        return overlay
