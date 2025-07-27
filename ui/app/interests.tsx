import LoaderScreen from "@/components/LoaderScreen";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, PanResponder, View } from "react-native";
import { Circle, Polygon, Svg, Text as SvgText } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const INTERESTS = ["Traffic", "Weather", "Events", "Food", "Safety", "Culture"];
const RADAR_RADIUS = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.35;
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = 260;

function polarToCartesian(angle: number, value: number, maxValue: number) {
  const r = (value / maxValue) * RADAR_RADIUS;
  const a = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: CENTER_X + r * Math.cos(a),
    y: CENTER_Y + r * Math.sin(a),
  };
}

export default function InterestsScreen() {
  const [values, setValues] = useState([3, 3, 3, 3, 3, 3]); // Default values
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const maxValue = 5;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, gestureState) => {
      const { locationX, locationY } = e.nativeEvent;
      // Find closest point
      let minDist = 9999;
      let idx = null;
      INTERESTS.forEach((_, i) => {
        const angle = (360 / INTERESTS.length) * i;
        const { x, y } = polarToCartesian(angle, values[i], maxValue);
        const dist = Math.hypot(locationX - x, locationY - y);
        if (dist < minDist && dist < 40) {
          minDist = dist;
          idx = i;
        }
      });
      setDraggingIdx(idx);
    },
    onPanResponderMove: (e, gestureState) => {
      if (draggingIdx !== null) {
        const { locationX, locationY } = e.nativeEvent;
        const dx = locationX - CENTER_X;
        const dy = locationY - CENTER_Y;
        const r = Math.min(Math.hypot(dx, dy), RADAR_RADIUS);
        const newValue = Math.round((r / RADAR_RADIUS) * maxValue);
        setValues((prev) =>
          prev.map((v, i) =>
            i === draggingIdx ? Math.max(1, Math.min(maxValue, newValue)) : v
          )
        );
      }
    },
    onPanResponderRelease: () => {
      setDraggingIdx(null);
    },
  });

  // Generate radar chart points
  const points = INTERESTS.map((interest, i) => {
    const angle = (360 / INTERESTS.length) * i;
    return polarToCartesian(angle, values[i], maxValue);
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const handleContinue = () => {
    setShowLoader(true);
    setTimeout(() => {
      router.replace("/(tabs)/feed");
    }, 2000);
  };

  if (showLoader) {
    return <LoaderScreen message="Loading feed..." />;
  }

  return (
    <Center style={{ flex: 1, padding: 24 }}>
      <Heading size="2xl" style={{ marginBottom: 16 }}>
        Select Your Interests
      </Heading>
      <Text>
        Drag the points to adjust your interest level for each category.
      </Text>
      <View style={{ width: SCREEN_WIDTH }} {...panResponder.panHandlers}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.6}>
          {/* Draw radar grid */}
          {[...Array(maxValue)].map((_, r) => (
            <Polygon
              key={r}
              points={INTERESTS.map((_, i) => {
                const angle = (360 / INTERESTS.length) * i;
                const { x, y } = polarToCartesian(angle, r + 1, maxValue);
                return `${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke="#ccc"
            />
          ))}
          {/* Draw user polygon */}
          <Polygon
            points={polygonPoints}
            fill="rgba(0,123,255,0.2)"
            stroke="#007bff"
            strokeWidth={2}
          />
          {/* Draw draggable points */}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={12}
              fill="#007bff"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
          {/* Draw interest labels */}
          {INTERESTS.map((interest, i) => {
            const angle = (360 / INTERESTS.length) * i;
            const { x, y } = polarToCartesian(angle, maxValue + 0.5, maxValue);
            return (
              <SvgText
                key={interest}
                x={x}
                y={y}
                fontSize={16}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#333"
              >
                {interest}
              </SvgText>
            );
          })}
        </Svg>
      </View>
      <Button onPress={handleContinue}>
        <ButtonText>Continue</ButtonText>
      </Button>
    </Center>
  );
}
