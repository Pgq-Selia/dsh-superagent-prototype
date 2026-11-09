import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const html = readFileSync(new URL('../examples/bmi-calculator/index.html', import.meta.url), 'utf8')
const script = readFileSync(new URL('../examples/bmi-calculator/calculator.js', import.meta.url), 'utf8')

type CategoryKey = 'underweight' | 'normal' | 'overweight' | 'obese'

interface CalculatorApi {
  computeBmi(heightCm: number, weightKg: number): number
  classify(bmi: number): CategoryKey
  healthyWeightRange(heightCm: number): { min: number; max: number }
  roundBmi(bmi: number): number
  markerPercent(bmi: number): number
  init(root?: Document): void
}

function load() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.eval(script)
  const api = (dom.window as unknown as { BMICalculator: CalculatorApi }).BMICalculator
  api.init(dom.window.document)
  return { dom, api }
}

function setInputs(dom: JSDOM, height: string, weight: string) {
  const document = dom.window.document
  const heightInput = document.getElementById('height') as HTMLInputElement
  const weightInput = document.getElementById('weight') as HTMLInputElement
  heightInput.value = height
  weightInput.value = weight
}

function submit(dom: JSDOM) {
  const form = dom.window.document.getElementById('bmi-form') as HTMLFormElement
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
}

describe('BMI calculator logic', () => {
  it('computes BMI from centimetres and kilograms', () => {
    const { api } = load()
    expect(api.computeBmi(170, 65)).toBeCloseTo(22.491, 3)
    expect(api.roundBmi(api.computeBmi(170, 65))).toBe(22.5)
  })

  it('classifies according to the Chinese adult BMI cut-offs', () => {
    const { api } = load()
    expect(api.classify(18.4)).toBe('underweight')
    expect(api.classify(18.5)).toBe('normal')
    expect(api.classify(23.9)).toBe('normal')
    expect(api.classify(24)).toBe('overweight')
    expect(api.classify(27.9)).toBe('overweight')
    expect(api.classify(28)).toBe('obese')
  })

  it('derives a healthy weight range from the height', () => {
    const { api } = load()
    const range = api.healthyWeightRange(170)
    expect(range.min).toBeCloseTo(53.465, 3)
    expect(range.max).toBeCloseTo(69.071, 3)
  })

  it('maps BMI values onto the gauge and clamps outliers', () => {
    const { api } = load()
    expect(api.markerPercent(15)).toBe(0)
    expect(api.markerPercent(25)).toBe(50)
    expect(api.markerPercent(35)).toBe(100)
    expect(api.markerPercent(12)).toBe(0)
    expect(api.markerPercent(42)).toBe(100)
  })
})

describe('BMI calculator page', () => {
  it('renders the BMI, category and healthy range after a valid submission', () => {
    const { dom } = load()
    setInputs(dom, '170', '65')
    submit(dom)

    const document = dom.window.document
    const result = document.getElementById('result') as HTMLElement
    expect(result.hidden).toBe(false)
    expect(result.dataset.category).toBe('normal')
    expect(document.getElementById('bmi-value')?.textContent).toBe('22.5')
    expect(document.getElementById('bmi-category')?.textContent).toBe('正常')
    expect(document.getElementById('bmi-summary')?.textContent).toContain('健康范围')
    expect(document.getElementById('bmi-marker')?.getAttribute('style')).toContain('37.5')
    expect(document.getElementById('healthy-range-value')?.textContent).toBe('约 53.5–69.1 kg')
    expect(document.getElementById('result-status')?.textContent).toBe('BMI 22.5，属于正常范围。')
  })

  it('shows an inline error and hides the result for invalid input', () => {
    const { dom } = load()
    setInputs(dom, '40', '65')
    submit(dom)

    const document = dom.window.document
    expect(document.getElementById('height')?.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById('height-error')?.textContent).toBe('身高需在 50–250 cm 之间')
    expect((document.getElementById('result') as HTMLElement).hidden).toBe(true)
  })

  it('requires both fields', () => {
    const { dom } = load()
    submit(dom)

    const document = dom.window.document
    expect(document.getElementById('height-error')?.textContent).toBe('请输入身高')
    expect(document.getElementById('weight-error')?.textContent).toBe('请输入体重')
  })

  it('clears a field error when the user edits it', () => {
    const { dom } = load()
    submit(dom)

    const document = dom.window.document
    const height = document.getElementById('height') as HTMLInputElement
    expect(height.getAttribute('aria-invalid')).toBe('true')

    height.value = '170'
    height.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    expect(height.getAttribute('aria-invalid')).toBe('false')
    expect(document.getElementById('height-error')?.textContent).toBe('')
  })

  it('classifies a BMI at the top of the scale as obese', () => {
    const { dom } = load()
    setInputs(dom, '160', '100')
    submit(dom)

    const document = dom.window.document
    const result = document.getElementById('result') as HTMLElement
    expect(result.dataset.category).toBe('obese')
    expect(document.getElementById('bmi-value')?.textContent).toBe('39.1')
    expect(document.getElementById('bmi-marker')?.getAttribute('style')).toContain('left: 100%')
  })
})
