import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { ChevronDownIcon } from "@/components/ui/icon";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@/components/ui/slider";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { db } from "@/services/firebase";
import clsx from "clsx";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, getDocs } from "firebase/firestore";
import React, { useState } from "react";
import { Dimensions, Image, View } from "react-native";
import Swiper from "react-native-deck-swiper";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DISMISS_THRESHOLD = SCREEN_WIDTH * 0.35;

const eventData = [
  {
    id: 1,
    category: "Traffic",
    title: "Traffic Jam on MG Road",
    description:
      "Heavy traffic reported on MG Road due to ongoing construction.",
    location: "MG Road, Bangalore",
    timestamp: "2023-10-01T10:00:00Z",
    media: {
      altText: "Niceeee",
      url: "https://picsum.photos/200/200",
    },
    truthnessScore: 0.8,
    sentimentRate: 1,
    author: "Sike",
    source: "Instagram",
  },
  {
    id: 2,
    category: "Weather",
    title: "Rain Alert",
    description: "Heavy rain expected in the city this evening.",
    location: "Bangalore",
    timestamp: "2023-10-01T12:00:00Z",
    media: {
      altText: "Rainy day",
      url: "https://picsum.photos/200",
    },
    truthnessScore: 0.9,
    sentimentRate: 0.5,
    author: "Sike",
    source: "Instagram",
  },
  {
    id: 3,
    category: "Traffic",
    title: "Accident on Outer Ring Road",
    description: "Accident reported on Outer Ring Road near Marathahalli.",
    location: "Outer Ring Road, Bangalore",
    timestamp: "2023-10-01T14:00:00Z",
    media: {
      altText: "Accident scene",
      url: "https://picsum.photos/200",
    },
    truthnessScore: 0.7,
    sentimentRate: 0.2,
    author: "Sike",
    source: "Instagram",
  },
];

function EventCard({ event }: { event: (typeof eventData)[0] }) {
  return (
    <View
      className={clsx(
        "w-full max-w-md rounded-2xl shadow-xl elevation-3 overflow-hidden bg-gray-800 dark:bg-white flex flex-col mx-auto transition-all duration-300",
        "sm:max-w-lg md:max-w-xl lg:max-w-2xl"
      )}
      accessible
      accessibilityLabel={event.title}
    >
      <Image
        source={{ uri: event.media.url }}
        className="w-full h-[20rem] object-cover"
        accessibilityLabel={event.media.altText}
      />
      <View className="p-4 flex-1 flex flex-col justify-between">
        <View>
          <Text className="text-xl font-bold mb-1 text-white dark:text-black">
            {event.title}
          </Text>
          <Text className="text-sm text-blue-400 mb-2">{event.category}</Text>
          <Text className="text-base mb-2 text-gray-200 dark:text-gray-700">
            {event.description}
          </Text>
          <Text className="text-sm text-gray-400 mb-2">{event.location}</Text>
        </View>
        <View className="mt-2">
          <Text className="text-xs text-gray-400">
            Truthness: {event.truthnessScore} | Sentiment: {event.sentimentRate}
          </Text>
          <Text className="text-xs text-gray-400">
            By {event.author} | Source: {event.source}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState(eventData);
  const [showDrawer, setShowDrawer] = useState(false);
  const [formText, setFormText] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState(0.5);
  const [category, setCategory] = useState("General");
  const [media, setMedia] = useState<{ uri: string; type: string } | null>(
    null
  );

  const categories = ["General", "Traffic", "Weather", "Event", "Other"];

  const handlePickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMedia({
        uri: result.assets[0].uri,
        type: result.assets[0].type || "image",
      });
    }
  };

  const handleAddPost = async () => {
    if (!formText.trim()) return;
    const newPost = {
      id: Date.now(),
      category,
      title: formText.slice(0, 30) + (formText.length > 30 ? "..." : ""),
      description: formText,
      location,
      timestamp: new Date().toISOString(),
      media: media
        ? { altText: "User post", url: media.uri, type: media.type }
        : {
            altText: "User post",
            url: "https://picsum.photos/200",
            type: "image",
          },
      truthnessScore: 1,
      sentimentRate: mood,
      author: "Anonymous",
      source: "App",
    };
    try {
      await addDoc(collection(db, "posts"), newPost);
      setPosts([newPost, ...posts]);
      setFormText("");
      setLocation("");
      setMood(0.5);
      setCategory("General");
      setMedia(null);
      setShowDrawer(false);
    } catch (e) {
      console.error("Error adding post:", e);
    }
  };

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        const events = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: typeof data.id === "number" ? data.id : Date.now(),
            category: data.category || "General",
            title: data.title || "Untitled",
            description: data.description || "",
            location: data.location || "",
            timestamp: data.timestamp || new Date().toISOString(),
            media: data.media || {
              altText: "User post",
              url: "https://picsum.photos/200",
            },
            truthnessScore:
              typeof data.truthnessScore === "number" ? data.truthnessScore : 1,
            sentimentRate:
              typeof data.sentimentRate === "number" ? data.sentimentRate : 0.5,
            author: data.author || "Anonymous",
            source: data.source || "App",
          };
        });
        if (events.length > 0) {
          setPosts(events);
        } else {
          setPosts(eventData);
        }
      } catch (e) {
        setPosts(eventData);
      }
    };
    fetchEvents();
  }, []);

  return (
    <Center className="">
      <Swiper
        // containerStyle={{
        //   width: "100%",
        //   height: "100vh",
        //   backgroundColor: "transparent",
        // }}
        cards={posts}
        renderCard={(card) => <EventCard event={card} />}
        stackSize={3}
        backgroundColor="transparent"
        cardHorizontalMargin={8}
        cardVerticalMargin={16}
        verticalSwipe={false}
        onSwiped={(cardIndex) => {}}
        onSwipedAll={() => {}}
        keyExtractor={(card) => card.id.toString()}
      />
      <Button
        className="fixed bottom-20 right-2 z-50 text-white rounded-full shadow-lg px-6 py-3"
        onPress={() => {
          setShowDrawer(true);
        }}
      >
        <ButtonText>Add Post</ButtonText>
      </Button>
      <Drawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
        }}
        size="md"
        anchor="bottom"
        className="rounded-t-2xl shadow-2xl"
      >
        <DrawerBackdrop />
        <DrawerContent className="p-4">
          <DrawerHeader>
            <Heading size="xl" className="text-center">
              Add Post
            </Heading>
          </DrawerHeader>
          <DrawerBody>
            <FormControl className="mb-4">
              <FormControlLabel>
                <FormControlLabelText>Location</FormControlLabelText>
              </FormControlLabel>
              <Textarea
                size="sm"
                isReadOnly={false}
                isInvalid={false}
                isDisabled={false}
                className="rounded-lg border border-gray-300 p-2 text-base w-full min-h-[40px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <TextareaInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter location"
                  className="w-full text-base text-gray-800 dark:text-gray-200"
                />
              </Textarea>
            </FormControl>
            <FormControl className="mb-4">
              <FormControlLabel>
                <FormControlLabelText>Mood</FormControlLabelText>
              </FormControlLabel>
              <Slider
                defaultValue={5}
                size="md"
                minValue={0}
                maxValue={10}
                value={mood * 10}
                onChange={(value) => setMood(value / 10)}
                orientation="horizontal"
                isDisabled={false}
                isReversed={false}
                step={1}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb>
                  {/* Emoji status based on mood value */}
                  <Text style={{ fontSize: 24 }}>
                    {mood <= 0.3 ? "😢" : mood <= 0.7 ? "😐" : "😄"}
                  </Text>
                </SliderThumb>
              </Slider>
            </FormControl>
            <FormControl className="mb-4">
              <FormControlLabel>
                <FormControlLabelText>Category</FormControlLabelText>
              </FormControlLabel>

              <Select
                selectedValue={category}
                onValueChange={setCategory}
                className="w-full"
              >
                <SelectTrigger variant="outline" size="md">
                  <SelectInput placeholder="Select option" />
                  <SelectIcon className="mr-3" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} label={cat} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>
            <FormControl className="mb-4">
              <FormControlLabel>
                <FormControlLabelText>Description</FormControlLabelText>
              </FormControlLabel>
              <Textarea
                size="sm"
                isReadOnly={false}
                isInvalid={false}
                isDisabled={false}
                className="rounded-lg border border-gray-300 p-2 text-base w-full min-h-[100px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <TextareaInput
                  value={formText}
                  onChangeText={setFormText}
                  placeholder="Traffic jam? Local event? Something interesting nearby? Post it here."
                  className="w-full text-base text-gray-800 dark:text-gray-200"
                />
              </Textarea>
            </FormControl>
            <FormControl className="mb-4">
              <FormControlLabel>
                <FormControlLabelText>Media (optional)</FormControlLabelText>
              </FormControlLabel>
              <Button
                onPress={handlePickMedia}
                className="mb-2 rounded-lg bg-gray-200 text-black px-4 py-2"
              >
                <ButtonText>Select Image or Video</ButtonText>
              </Button>
              {media && (
                <View className="mb-2">
                  {media.type === "image" ? (
                    <Image
                      source={{ uri: media.uri }}
                      style={{ width: 120, height: 120, borderRadius: 8 }}
                    />
                  ) : (
                    <Text>Video selected</Text>
                  )}
                </View>
              )}
            </FormControl>
          </DrawerBody>
          <DrawerFooter className="flex flex-row gap-2">
            <Button
              onPress={handleAddPost}
              className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 transition-all duration-200"
            >
              <ButtonText>Submit</ButtonText>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Center>
  );
}
