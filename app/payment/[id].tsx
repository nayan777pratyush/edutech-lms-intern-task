import React, { useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { Image } from 'expo-image';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

import { useCourses } from '../../store/courseStore';

export default function PaymentScreen() {
  const router = useRouter();

  const { id, title, price, thumbnail } =
    useLocalSearchParams<{
      id: string;
      title: string;
      price: string;
      thumbnail?: string;
    }>();

  const { enrolled, toggleEnroll } = useCourses();

  const [paymentMethod, setPaymentMethod] = useState<
    'upi' | 'card' | 'netbanking'
  >('upi');

  const [isProcessing, setIsProcessing] = useState(false);

  const isAlreadyEnrolled = enrolled.includes(String(id));

const handlePaymentSuccess = () => {
  const message = `You have successfully enrolled in "${title}".`;

  if (Platform.OS === 'web') {
    window.alert(`Payment Successful 🎉\n\n${message}`);

    router.replace({
      pathname: '/learning/[id]',
      params: {
        id: String(id),
        title: title || '',
      },
    });

    return;
  }

  Alert.alert(
    'Payment Successful 🎉',
    message,
    [
      {
        text: 'Start Learning',
        onPress: () => {
          router.replace({
            pathname: '/learning/[id]',
            params: {
              id: String(id),
              title: title || '',
            },
          });
        },
      },
    ],
    { cancelable: false }
  );
};


const handlePayment = async () => {
  if (isProcessing) return;

  if (isAlreadyEnrolled) {
    if (Platform.OS === 'web') {
      window.alert(
        'Already Enrolled\n\nYou are already enrolled in this course.'
      );
    } else {
      Alert.alert(
        'Already Enrolled',
        'You are already enrolled in this course.'
      );
    }

    router.replace({
      pathname: '/course/[id]',
      params: { id: String(id) },
    });

    return;
  }

  setIsProcessing(true);

  try {
    // Demo payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Enroll exactly once
    await toggleEnroll(String(id));

    // Automatically show success after payment
    handlePaymentSuccess();
  } catch (error) {
    console.error('Payment error:', error);

    if (Platform.OS === 'web') {
      window.alert(
        'Payment Failed\n\n' +
        'Something went wrong while processing your payment. Please try again.'
      );
    } else {
      Alert.alert(
        'Payment Failed',
        'Something went wrong while processing your payment. Please try again.'
      );
    }
  } finally {
    setIsProcessing(false);
  }
};


  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-10"
    >
      <View className="p-4">
        <Text className="text-2xl font-extrabold text-foreground mb-1">
          Checkout
        </Text>

        <Text className="text-sm text-muted mb-5">
          Complete your enrollment to start learning.
        </Text>

        {/* Course */}
        <View className="bg-surface rounded-xl border border-border overflow-hidden mb-5">
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              className="w-full h-[180px] bg-border"
              contentFit="cover"
            />
          ) : null}

          <View className="p-4">
            <Text className="text-xs text-muted mb-1">
              COURSE
            </Text>

            <Text className="text-lg font-extrabold text-foreground">
              {title}
            </Text>

            <View className="flex-row justify-between items-center mt-4">
              <Text className="text-sm text-muted">
                Course Price
              </Text>

              <Text className="text-xl font-extrabold text-primary">
                ${Number(price || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <Text className="text-base font-bold text-foreground mb-3">
          Payment Method
        </Text>

        <TouchableOpacity
          className={`bg-surface rounded-xl border p-4 mb-3 flex-row items-center ${
            paymentMethod === 'upi'
              ? 'border-primary'
              : 'border-border'
          }`}
          onPress={() => setPaymentMethod('upi')}
        >
          <Ionicons
            name="phone-portrait-outline"
            size={22}
            color={
              paymentMethod === 'upi'
                ? Colors.primary
                : Colors.textSecondary
            }
          />

          <View className="flex-1 ml-3">
            <Text className="text-sm font-bold text-foreground">
              UPI
            </Text>

            <Text className="text-xs text-muted mt-1">
              Pay using UPI
            </Text>
          </View>

          <Ionicons
            name={
              paymentMethod === 'upi'
                ? 'radio-button-on'
                : 'radio-button-off'
            }
            size={22}
            color={
              paymentMethod === 'upi'
                ? Colors.primary
                : Colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          className={`bg-surface rounded-xl border p-4 mb-3 flex-row items-center ${
            paymentMethod === 'card'
              ? 'border-primary'
              : 'border-border'
          }`}
          onPress={() => setPaymentMethod('card')}
        >
          <Ionicons
            name="card-outline"
            size={22}
            color={
              paymentMethod === 'card'
                ? Colors.primary
                : Colors.textSecondary
            }
          />

          <View className="flex-1 ml-3">
            <Text className="text-sm font-bold text-foreground">
              Card
            </Text>

            <Text className="text-xs text-muted mt-1">
              Credit or debit card
            </Text>
          </View>

          <Ionicons
            name={
              paymentMethod === 'card'
                ? 'radio-button-on'
                : 'radio-button-off'
            }
            size={22}
            color={
              paymentMethod === 'card'
                ? Colors.primary
                : Colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          className={`bg-surface rounded-xl border p-4 mb-5 flex-row items-center ${
            paymentMethod === 'netbanking'
              ? 'border-primary'
              : 'border-border'
          }`}
          onPress={() => setPaymentMethod('netbanking')}
        >
          <Ionicons
            name="business-outline"
            size={22}
            color={
              paymentMethod === 'netbanking'
                ? Colors.primary
                : Colors.textSecondary
            }
          />

          <View className="flex-1 ml-3">
            <Text className="text-sm font-bold text-foreground">
              Net Banking
            </Text>

            <Text className="text-xs text-muted mt-1">
              Pay through your bank
            </Text>
          </View>

          <Ionicons
            name={
              paymentMethod === 'netbanking'
                ? 'radio-button-on'
                : 'radio-button-off'
            }
            size={22}
            color={
              paymentMethod === 'netbanking'
                ? Colors.primary
                : Colors.textSecondary
            }
          />
        </TouchableOpacity>

        {/* Payment Information */}
        <View className="bg-primary-light rounded-xl p-4 mb-5">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={Colors.primary}
            />

            <Text className="text-sm font-bold text-primary ml-2">
              Secure Checkout
            </Text>
          </View>

          <Text className="text-xs text-muted leading-5">
            This is a demo payment flow for the EduTech
            internship project. No real money will be charged.
          </Text>
        </View>

        {/* Pay Button */}
<TouchableOpacity
  disabled={isProcessing || isAlreadyEnrolled}
  onPress={handlePayment}
  className={`rounded-xl py-4 items-center ${
    isProcessing || isAlreadyEnrolled
      ? 'bg-gray-400'
      : 'bg-primary'
  }`}
>
{isProcessing ? (
  <View className="flex-row items-center">
    <ActivityIndicator color="#FFFFFF" />
    <Text className="text-white font-bold ml-2">
      Processing Payment...
    </Text>
  </View>
) : isAlreadyEnrolled ? (
  <Text className="text-white font-bold">
    Already Enrolled
  </Text>
) : (
  <Text className="text-white font-bold">
    Pay ${Number(price || 0).toFixed(2)}
  </Text>
)}
</TouchableOpacity>
      </View>
    </ScrollView>
  );
}