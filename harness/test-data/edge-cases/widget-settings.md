# Widget Settings Edge Case Data

## Invalid Colors
```
themeColor: "not-a-color" → should fallback to default
themeColor: "#gggggg" → should fallback to default
themeColor: "#12345" → should fallback to default (5 chars)
themeColor: "#123" → should be valid (3-char hex)
themeColor: "#123456" → should be valid (6-char hex)
```

## String Length Boundaries
```
title: "" (empty) → should use default "Send feedback"
title: "A".repeat(81) → should be truncated to 80 chars
subtitle: "A".repeat(141) → should be truncated to 140 chars
placeholder: "A".repeat(201) → should be truncated to 200 chars
buttonText: "A".repeat(41) → should be truncated to 40 chars
bubbleLabel: "A".repeat(13) → should be truncated to 12 chars
```

## Auto-Open Delay Boundaries
```
autoOpenDelay: -1 → should become 0
autoOpenDelay: 0 → valid
autoOpenDelay: 120 → valid
autoOpenDelay: 121 → should become 120
autoOpenDelay: "abc" → should become 0
```

## Position Values
```
position: "bottom-right" → valid
position: "bottom-left" → valid
position: "top-right" → valid
position: "top-left" → valid
position: "bottom-center" → valid
position: "invalid" → should fallback to "bottom-right"
```