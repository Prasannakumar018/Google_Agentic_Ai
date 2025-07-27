import { useRef, useState } from "react";
import { Dimensions, PanResponder, View } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";

const { width } = Dimensions.get("window");
const CHART_SIZE = width * 0.9;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 40;

const categories = ["News", "Traffic", "Weather", "Events", "Safety"];
const TOTAL_AXES = categories.length;

function polarToCartesian(angle, radius) {
  const x = CENTER + radius * Math.cos(angle);
  const y = CENTER + radius * Math.sin(angle);
  return { x, y };
}

export default function InteractiveRadarChart() {
  const [values, setValues] = useState(Array(TOTAL_AXES).fill(0.5)); // range: 0.0 - 1.0
  const panResponders = useRef([]);

  const handleDrag = (index, gestureState) => {
    const dx = gestureState.moveX - CENTER;
    const dy = gestureState.moveY - CENTER;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), RADIUS);
    const newVal = dist / RADIUS;

    setValues((prev) => {
      const updated = [...prev];
      updated[index] = Math.min(Math.max(newVal, 0), 1);
      return updated;
    });
  };

  if (panResponders.current.length === 0) {
    for (let i = 0; i < TOTAL_AXES; i++) {
      panResponders.current[i] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => handleDrag(i, gestureState),
      });
    }
  }

  const points = values.map((v, i) => {
    const angle = (2 * Math.PI * i) / TOTAL_AXES - Math.PI / 2;
    return polarToCartesian(angle, v * RADIUS);
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        {/* Axes */}
        {categories.map((_, i) => {
          const angle = (2 * Math.PI * i) / TOTAL_AXES - Math.PI / 2;
          const end = polarToCartesian(angle, RADIUS);
          return (
            <Line
              key={`axis-${i}`}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              stroke="#999"
              strokeWidth="1"
            />
          );
        })}

        {/* Labels */}
        {categories.map((label, i) => {
          const angle = (2 * Math.PI * i) / TOTAL_AXES - Math.PI / 2;
          const { x, y } = polarToCartesian(angle, RADIUS + 15);
          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={y}
              fontSize="12"
              fill="#333"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* User Polygon */}
        <Polygon points={polygonPoints} fill="rgba(0, 128, 255, 0.3)" stroke="#0080ff" strokeWidth="2" />

        {/* Draggable Points */}
        {points.map((point, i) => (
          <Circle
            key={`handle-${i}`}
            cx={point.x}
            cy={point.y}
            r={10}
            fill="#0080ff"
            {...panResponders.current[i].panHandlers}
          />
        ))}
      </Svg>
    </View>
  );
}
