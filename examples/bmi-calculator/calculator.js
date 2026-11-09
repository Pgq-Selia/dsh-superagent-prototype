(function () {
  'use strict';

  // The gauge covers BMI 15–35; values outside that window are pinned to its ends.
  var SCALE_MIN = 15;
  var SCALE_MAX = 35;

  var CATEGORIES = {
    underweight: {
      label: '偏瘦',
      summary: '体重偏低。可以适当增加营养摄入，并咨询医生或营养师。',
    },
    normal: {
      label: '正常',
      summary: '体重在健康范围内，继续保持均衡饮食和规律运动。',
    },
    overweight: {
      label: '超重',
      summary: '体重偏高。建议控制饮食、增加运动，必要时咨询专业人士。',
    },
    obese: {
      label: '肥胖',
      summary: '体重明显偏高，建议在医生或营养师指导下进行体重管理。',
    },
  };

  function computeBmi(heightCm, weightKg) {
    var heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  function classify(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 24) return 'normal';
    if (bmi < 28) return 'overweight';
    return 'obese';
  }

  function healthyWeightRange(heightCm) {
    var heightM = heightCm / 100;
    return {
      min: 18.5 * heightM * heightM,
      max: 23.9 * heightM * heightM,
    };
  }

  function roundBmi(bmi) {
    return Math.round(bmi * 10) / 10;
  }

  function markerPercent(bmi) {
    var clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, bmi));
    return ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
  }

  function validate(input, label, unit, min, max) {
    var raw = input.value.trim();
    if (raw === '') return { error: '请输入' + label };

    var value = Number(raw);
    if (!Number.isFinite(value)) return { error: '请输入有效的数字' };
    if (value < min || value > max) {
      return { error: label + '需在 ' + min + '–' + max + ' ' + unit + ' 之间' };
    }
    return { value: value };
  }

  function setError(input, message) {
    var error = input.ownerDocument.getElementById(input.id + '-error');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message || '';
  }

  function init(root) {
    root = root || document;
    if (root.documentElement.dataset.bmiReady === 'true') return;

    var form = root.getElementById('bmi-form');
    if (!form) return;
    root.documentElement.dataset.bmiReady = 'true';

    var heightInput = root.getElementById('height');
    var weightInput = root.getElementById('weight');
    var result = root.getElementById('result');
    var bmiValue = root.getElementById('bmi-value');
    var categoryValue = root.getElementById('bmi-category');
    var summary = root.getElementById('bmi-summary');
    var marker = root.getElementById('bmi-marker');
    var healthyRange = root.getElementById('healthy-range-value');
    var status = root.getElementById('result-status');

    function clearError(input) {
      if (input.getAttribute('aria-invalid') === 'true') setError(input, '');
    }

    function showResult(heightCm, weightKg) {
      // Classify the displayed (one-decimal) value so the number and the
      // category shown to the user always agree.
      var bmi = roundBmi(computeBmi(heightCm, weightKg));
      var categoryKey = classify(bmi);
      var category = CATEGORIES[categoryKey];
      var range = healthyWeightRange(heightCm);

      result.hidden = false;
      result.dataset.category = categoryKey;
      bmiValue.textContent = bmi.toFixed(1);
      categoryValue.textContent = category.label;
      summary.textContent = category.summary;
      marker.style.left = markerPercent(bmi).toFixed(2) + '%';
      healthyRange.textContent =
        '约 ' + range.min.toFixed(1) + '–' + range.max.toFixed(1) + ' kg';
      status.textContent = 'BMI ' + bmi.toFixed(1) + '，属于' + category.label + '范围。';
    }

    function handleSubmit(event) {
      event.preventDefault();

      var height = validate(heightInput, '身高', 'cm', 50, 250);
      var weight = validate(weightInput, '体重', 'kg', 10, 300);
      var firstInvalid = null;

      if (height.error) {
        setError(heightInput, height.error);
        firstInvalid = firstInvalid || heightInput;
      } else {
        setError(heightInput, '');
      }

      if (weight.error) {
        setError(weightInput, weight.error);
        firstInvalid = firstInvalid || weightInput;
      } else {
        setError(weightInput, '');
      }

      if (firstInvalid) {
        result.hidden = true;
        status.textContent = '';
        firstInvalid.focus();
        return;
      }

      showResult(height.value, weight.value);
    }

    form.addEventListener('submit', handleSubmit);
    heightInput.addEventListener('input', function () {
      clearError(heightInput);
    });
    weightInput.addEventListener('input', function () {
      clearError(weightInput);
    });
  }

  var api = {
    computeBmi: computeBmi,
    classify: classify,
    healthyWeightRange: healthyWeightRange,
    roundBmi: roundBmi,
    markerPercent: markerPercent,
    init: init,
  };

  var globalScope = typeof window !== 'undefined' ? window : globalThis;
  globalScope.BMICalculator = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        init(document);
      });
    } else {
      init(document);
    }
  }
})();
