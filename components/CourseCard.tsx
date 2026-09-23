import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Course, useCourses } from '../store/courseStore';

interface Props {
  course: Course;
}

const getCourseThumbnail = () => {
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/course-${randomId}/400/250`;
};

function CourseCard({ course }: Props) {
  const router = useRouter();
  const { bookmarks, toggleBookmark } = useCourses();
  const isBookmarked = bookmarks.includes(String(course.id));
  const thumbnail = getCourseThumbnail();

  return (
    <TouchableOpacity
      className="bg-surface rounded-xl mx-4 mb-3.5 overflow-hidden shadow-md elevation-3"
      onPress={() =>
        router.push({
          pathname: `/course/${course.id}`,
          params: {
            thumbnail,
          },
        })
      }
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: getCourseThumbnail() }}
        className="w-full h-40 bg-border"
        contentFit="cover"
        transition={200}
      />
      <View className="p-3">
        <View className="flex-row items-center mb-1.5">
          <Image
            source={{ uri: course.instructorAvatar }}
            className="w-6 h-6 rounded-full mr-1.5 bg-border"
            contentFit="cover"
          />
          <Text className="text-xs text-primary font-semibold flex-1" numberOfLines={1}>
            {course.instructorName ?? 'Unknown'}
          </Text>
        </View>
        <Text className="text-[15px] font-bold text-foreground mb-1" numberOfLines={2}>
          {course.title}
        </Text>
        <Text className="text-[13px] text-muted leading-[18px] mb-2" numberOfLines={2}>
          {course.description}
        </Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-[15px] font-bold text-secondary">
            ${course.price.toFixed(2)}
          </Text>
          <Pressable onPress={() => toggleBookmark(String(course.id))} hitSlop={8}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isBookmarked ? Colors.bookmark : Colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(CourseCard);
