# BMI 计算器

一个零依赖的网页版 BMI 计算器：输入身高（cm）和体重（kg），即可得到 BMI、体重分级和该身高对应的健康体重范围。

## 使用

直接用浏览器打开 `index.html`，或在仓库根目录启动任意静态服务器：

```sh
python3 -m http.server 8000
```

然后访问 <http://localhost:8000/examples/bmi-calculator/>。

## 说明

BMI = 体重（kg）÷ 身高（m）²。分级采用中国成人标准（WS/T 428-2013）：

| BMI | 分级 |
| --- | --- |
| < 18.5 | 偏瘦 |
| 18.5–23.9 | 正常 |
| 24–27.9 | 超重 |
| ≥ 28 | 肥胖 |

结果仅供参考，不能代替医学诊断。儿童、孕妇、运动员等特殊人群不适用该标准。

## 测试

页面逻辑由仓库根目录的单元测试覆盖：

```sh
pnpm vitest run tests/bmi-calculator.spec.ts
```
