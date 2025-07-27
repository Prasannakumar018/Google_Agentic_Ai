import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import debounce from "lodash.debounce";
import React, { useCallback, useEffect, useRef } from "react";
import { Dimensions, Platform } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DISMISS_THRESHOLD = 100;

interface CardStackProps {
  data: any[];
  renderCard: (item: any, idx: number) => React.ReactNode;
  onStackChange?: (newStack: any[]) => void;
}

export const CardStack: React.FC<CardStackProps> = ({
  data,
  renderCard,
  onStackChange,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stack = useRef(data);

  // Native gesture logic
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: 1 - Math.abs(translateX.value) / SCREEN_WIDTH / 8 },
    ],
    zIndex: 10,
  }));

  const handleStackChange = useCallback(
    (newStack: any[]) => {
      stack.current = newStack;
      if (onStackChange) onStackChange(newStack);
    },
    [onStackChange]
  );

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      if (Math.abs(translateX.value) > DISMISS_THRESHOLD) {
        runOnJS(handleStackChange)([
          ...stack.current.slice(1),
          stack.current[0],
        ]);
        translateX.value = 0;
        translateY.value = 0;
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  // Web scroll logic
  useEffect(() => {
    if (Platform.OS === "web" && scrollRef.current) {
      const debouncedScroll = debounce(
        (deltaY: number) => {
          if (Math.abs(deltaY) > 40) {
            handleStackChange([...stack.current.slice(1), stack.current[0]]);
          }
        },
        200,
        { leading: true, trailing: false }
      );
      const handleScroll = (e: WheelEvent) => {
        debouncedScroll(e.deltaY || (e.target as HTMLElement).scrollTop);
      };
      const node = scrollRef.current;
      node.addEventListener("wheel", handleScroll);
      return () => node.removeEventListener("wheel", handleScroll);
    }
  }, [handleStackChange]);

  function getCardStyle(idx: number, isTop: boolean) {
    const scale = 1 - idx * 0.05;
    const translateY = idx * 16;
    return `${isTop ? "" : "absolute"} w-11/12 left-0 right-0 mx-auto ${
      isTop ? "" : `top-[${translateY}px]`
    } ${isTop ? "z-10" : `z-${10 - idx}`} scale-[${scale}]`;
  }

  // Render stack
  if (Platform.OS === "web") {
    return (
      <div
        ref={scrollRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        tabIndex={-1}
      >
        {stack.current.slice(0, 3).map((item, idx) => {
          const isTop = idx === 0;
          return (
            <Card
              key={item.id}
              className={
                getCardStyle(idx, false) +
                " shadow-lg rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-gray-200 dark:border-zinc-800 transition-all duration-300"
              }
              accessible
              accessibilityLabel={item.title}
              style={{ pointerEvents: isTop ? "auto" : "none" }}
            >
              {renderCard(item, idx)}
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <Box className="flex-1 items-center justify-center">
      {stack.current.slice(0, 3).map((item, idx) => {
        const isTop = idx === 0;
        if (isTop) {
          return (
            <PanGestureHandler key={item.id} onGestureEvent={gestureHandler}>
              <Animated.View
                style={[animatedCardStyle]}
                className={
                  getCardStyle(idx, true) + " transition-all duration-300"
                }
                accessible
                accessibilityLabel={item.title}
              >
                <Card className="shadow-xl rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-gray-200 dark:border-zinc-800">
                  {renderCard(item, idx)}
                </Card>
              </Animated.View>
            </PanGestureHandler>
          );
        }
        return (
          <Card
            key={item.id}
            className={
              getCardStyle(idx, false) +
              " shadow-lg rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-gray-200 dark:border-zinc-800 transition-all duration-300"
            }
            accessible
            accessibilityLabel={item.title}
          >
            {renderCard(item, idx)}
          </Card>
        );
      })}
    </Box>
  );
};
