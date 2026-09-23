import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useCourses } from '../../store/courseStore';
import { generateCourseInsights } from '@/utils/ai';

export default function CourseDetailScreen() {
  const { id, thumbnail } = useLocalSearchParams<{ id: string; thumbnail: string }>();
  const router = useRouter();
  const { courses, bookmarks, enrolled, toggleBookmark, toggleEnroll } = useCourses();

  const course = courses.find((c) => String(c.id) === id);
  if (!course) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-muted text-base">Course not found</Text>
      </View>
    );
  }

  const isBookmarked = bookmarks.includes(String(course.id));
  const isEnrolled = enrolled.includes(String(course.id));

  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleEnroll = async () => {
    await toggleEnroll(String(course.id));
    if (!isEnrolled) {
      Alert.alert('Enrolled! 🎉', `You are now enrolled in "${course.title}"`);
    }
  };

  const loadAIInsights = async () => {
    setAiLoading(true);

    const result = await generateCourseInsights(course);

    setAiInsights(result);
    setAiLoading(false);
  };

  useEffect(() => {
    if (course) {
      loadAIInsights();
    }
  }, [course?.id]);

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: thumbnail ?? 'https://picsum.photos/400/250' }}
        className="w-full h-[220px] bg-border"
        contentFit="cover"
      />

      <View className="p-4">
        <View className="self-start bg-primary-light rounded-md px-2.5 py-1 mb-2.5">
          <Text className="text-primary text-xs font-bold capitalize">{course.category}</Text>
        </View>

        <Text className="text-xl font-extrabold text-foreground mb-3.5 leading-[26px]">
          {course.title}
        </Text>

        <View className="flex-row items-center gap-2.5 mb-3">
          <Image
            source={{ uri: course.instructorAvatar }}
            className="w-11 h-11 rounded-full bg-border"
            contentFit="cover"
          />
          <View>
            <Text className="text-[11px] text-muted">Instructor</Text>
            <Text className="text-sm font-bold text-foreground">{course.instructorName}</Text>
          </View>
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={16} color={Colors.warning} />
            <Text className="text-sm text-muted font-semibold">
              {course.rating?.toFixed(1)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} />
            <Text className="text-sm text-muted font-semibold">
              ${course.price.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text className="text-base font-bold text-foreground mb-2">Description</Text>
        <Text className="text-sm text-muted leading-[22px] mb-5">{course.description}</Text>

        <View className="bg-primary-light rounded-xl p-3.5 mb-4">
          <View className="flex-row items-center gap-1.5 mb-2.5">
            <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
            <Text className="text-base font-extrabold text-primary">AI Course Insights</Text>
          </View>

          {aiLoading ? (
            <Text className="text-[13px] text-muted leading-5">Generating AI summary...</Text>
          ) : aiInsights ? (
            <>
              <Text className="text-sm font-bold text-foreground mt-2 mb-1">
                What you will learn
              </Text>
              {aiInsights.whatYouWillLearn?.map((item: string, index: number) => (
                <Text key={index} className="text-[13px] text-muted leading-5">
                  • {item}
                </Text>
              ))}

              <Text className="text-sm font-bold text-foreground mt-2 mb-1">
                Best suited for
              </Text>
              <Text className="text-[13px] text-muted leading-5">{aiInsights.bestFor}</Text>

              <Text className="text-sm font-bold text-foreground mt-2 mb-1">Summary</Text>
              <Text className="text-[13px] text-muted leading-5">{aiInsights.aiSummary}</Text>
            </>
          ) : (
            <TouchableOpacity
              className="bg-primary rounded-lg py-2.5 items-center"
              onPress={loadAIInsights}
            >
              <Text className="text-white text-sm font-bold">Generate AI Summary</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity
            className={`flex-1 rounded-[10px] py-3.5 items-center ${
              isEnrolled ? 'bg-success' : 'bg-primary'
            }`}
            onPress={handleEnroll}
          >
            <Text className="text-white text-base font-bold">
              {isEnrolled ? '✓ Enrolled' : 'Enroll Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[50px] bg-primary-light rounded-[10px] justify-center items-center"
            onPress={() => toggleBookmark(String(course.id))}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isBookmarked ? Colors.bookmark : Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-secondary rounded-[10px] py-3.5 flex-row items-center justify-center gap-2"
          onPress={() =>
            router.push({
              pathname: '/webview',
              params: {
                title: course.title,
                instructor: course.instructorName,
                price: String(course.price),
                description: course.description,
                thumbnail: course.thumbnail,
              },
            })
          }
        >
          <Ionicons name="play-circle-outline" size={20} color="#fff" />
          <Text className="text-white text-[15px] font-bold">View Course Content</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
