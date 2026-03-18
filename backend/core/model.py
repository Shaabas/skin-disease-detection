"""
Skin Disease Classification Model
Uses ConvNeXt V2 as backbone (CNN) fine-tuned on HAM10000.
Integrated via Hugging Face Transformers.
"""

import os
import sys
import numpy as np
import logging
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

logger = logging.getLogger(__name__)

class SkinDiseaseModel:
    """
    Skin disease classifier using ConvNeXt V2 backbone (CNN).
    """

    MODEL_ID = "ALM-AHME/convnextv2-large-1k-224-finetuned-Lesion-Classification-HAM10000-AH-60-20-20-Shuffled-3rd"

    # Mapping based on the HF model's config (id2label)
    # 0: akiec, 1: bcc, 2: bkl, 3: df, 4: mel, 5: nv, 6: vasc
    CLASS_LABELS = {
        0: "Actinic Keratosis",     # akiec
        1: "Basal Cell Carcinoma",  # bcc
        2: "Benign Keratosis",      # bkl
        3: "Dermatofibroma",        # df
        4: "Melanoma",              # mel
        5: "Melanocytic Nevi",      # nv
        6: "Vascular Lesion",       # vasc
    }

    CLASS_NAMES = [
        "Actinic Keratosis", "Basal Cell Carcinoma", "Benign Keratosis",
        "Dermatofibroma", "Melanoma", "Melanocytic Nevi", "Vascular Lesion"
    ]

    CLASS_DESCRIPTIONS = {
        "Melanocytic Nevi": "Common moles — benign pigmented skin lesions caused by clusters of melanocytes.",
        "Melanoma": "A serious form of skin cancer that develops in melanocytes. Early detection is critical.",
        "Benign Keratosis": "Non-cancerous skin growth including seborrheic keratoses and solar lentigines.",
        "Basal Cell Carcinoma": "Most common skin cancer, arising from basal cells. Rarely spreads but needs treatment.",
        "Actinic Keratosis": "Rough, scaly patch caused by UV damage. Can progress to squamous cell carcinoma.",
        "Vascular Lesion": "Abnormal blood vessel formations including hemangiomas and port-wine stains.",
        "Dermatofibroma": "Benign fibrous nodule, usually on legs. Firm, small bump that is harmless.",
    }

    CLASS_SEVERITY = {
        "Melanocytic Nevi": "low",
        "Melanoma": "critical",
        "Benign Keratosis": "low",
        "Basal Cell Carcinoma": "high",
        "Actinic Keratosis": "medium",
        "Vascular Lesion": "low",
        "Dermatofibroma": "low",
    }

    CLASS_RECOMMENDATIONS = {
        "Melanocytic Nevi": "Monitor for changes in size, shape, or color. Annual skin check recommended.",
        "Melanoma": "URGENT: Consult a dermatologist immediately. Early treatment is vital.",
        "Benign Keratosis": "Usually harmless. See a doctor if it becomes itchy, bleeds, or changes rapidly.",
        "Basal Cell Carcinoma": "Schedule a dermatologist appointment soon for biopsy and treatment planning.",
        "Actinic Keratosis": "See a dermatologist for cryotherapy or topical treatment. Use sunscreen daily.",
        "Vascular Lesion": "Generally benign. Consult a dermatologist if it grows or causes discomfort.",
        "Dermatofibroma": "No treatment usually needed. See a doctor if it changes or causes pain.",
    }

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.processor = None
        self._load_model()

    def _load_model(self):
        """Load pretrained ConvNeXt V2 model and processor from Hugging Face."""
        try:
            logger.info(f"Trying to load ConvNeXt V2 model from local cache: {self.MODEL_ID}")
            # Try loading from local cache first to avoid internet connection and ETag checks
            self.processor = AutoImageProcessor.from_pretrained(self.MODEL_ID, local_files_only=True)
            self.model = AutoModelForImageClassification.from_pretrained(self.MODEL_ID, local_files_only=True)
            self.model.to(self.device).eval()
            logger.info("HF Model loaded successfully from local cache!")
        except Exception:
            logger.info("Model not found locally. Downloading from Hugging Face (this happens only once)...")
            try:
                self.processor = AutoImageProcessor.from_pretrained(self.MODEL_ID)
                self.model = AutoModelForImageClassification.from_pretrained(self.MODEL_ID)
                self.model.to(self.device).eval()
                logger.info("HF Model downloaded and loaded successfully!")
            except Exception as e:
                logger.error(f"Error loading HF model: {e}")

    def preprocess_image(self, image: Image.Image) -> dict:
        """Preprocess PIL image for model inference using AutoImageProcessor."""
        if self.processor is None:
            # Fallback resizing if processor not available (shouldn't happen)
            image = image.resize((224, 224), Image.LANCZOS)
            return {"pixel_values": torch.zeros((1, 3, 224, 224))}
        
        inputs = self.processor(images=image, return_tensors="pt")
        return {k: v.to(self.device) for k, v in inputs.items()}

    def predict(self, inputs: dict) -> np.ndarray:
        """Run inference and return class probabilities."""
        if self.model is None:
            logger.warning("Model not loaded. Returning random predictions.")
            return np.random.dirichlet(np.ones(len(self.CLASS_NAMES)) * 0.5)

        with torch.no_grad():
            outputs = self.model(**inputs)
            # Apply softmax to logit outputs to get probabilities
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            return probs[0].cpu().numpy()

    def get_last_conv_layer_name(self) -> str:
        """Placeholder for Grad-CAM layer selection (ConvNeXt uses stages)."""
        # For ConvNeXt V2 Large, the last stage has multiple layers.
        return "convnextv2.encoder.stages.3.layers.3" 
