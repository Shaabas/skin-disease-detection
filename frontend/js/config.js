window.DERM_CONFIG = {
  API: "http://localhost:5000",
  SEV_COLORS: {
    low:      '#059669',
    medium:   '#d97706',
    high:     '#ea580c',
    critical: '#dc2626',
  },
  sevLabel: s => ({ low:'Low Risk', medium:'Moderate', high:'High Risk', critical:'Critical' }[s] || s),
  sevChip: s => ({ low:'chip-green', medium:'chip-amber', high:'chip-orange', critical:'chip-red' }[s] || 'chip-gray'),
  confClass: p => p >= 70 ? 'high' : p >= 40 ? 'medium' : 'low'
};
