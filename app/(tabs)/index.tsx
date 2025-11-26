import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Auto-switch API endpoint for Web vs Android/iOS
const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:3000"
    : "http://192.168.1.23:3000"; // <-- replace with your PC IPv4

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I’m your GPT Live prototype. Type or use the mic to chat.",
    },
  ]);

  const [input, setInput] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Speak out text
  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text);
  };

  // Text message → simple echo for now
  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `You said: ${input}`,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    speak(aiMessage.content);
    setInput("");
  };

  // 🎙 Start recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Mic permission is required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  // ⏹ Stop recording and send
  const stopRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        await sendVoiceMessage(uri);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  // Send recorded audio to backend
  const sendVoiceMessage = async (uri: string) => {
    try {
      const voiceMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: "[Voice message]",
      };
      setMessages((prev) => [...prev, voiceMsg]);

      const formData = new FormData();
      formData.append("audio", {
        uri,
        name: "audio.m4a",
        type: "audio/m4a",
      } as any);

      const res = await fetch(`${BASE_URL}/voice-chat`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const transcript = data.transcript || "";
      const replyText =
        data.reply || "Sorry, I had trouble understanding that.";

      const transcriptMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "user",
        content: transcript,
      };

      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: replyText,
      };

      setMessages((prev) => [...prev, transcriptMsg, aiMessage]);
      speak(replyText);
    } catch (e) {
      console.error("VOICE ERROR", e);
      const errMsg: Message = {
        id: (Date.now() + 3).toString(),
        role: "assistant",
        content: "Error talking to voice server.",
      };
      setMessages((prev) => [...prev, errMsg]);
      speak(errMsg.content);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GPT Live</Text>
        <Text style={styles.headerSubtitle}>Voice & text assistant</Text>
      </View>

      <View style={styles.chatCard}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.user : styles.ai,
              ]}
            >
              <Text style={styles.text}>{item.content}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            styles.micButton,
            isRecording && styles.micActive,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.iconText}>{isRecording ? "■" : "🎤"}</Text>
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type your message…"
            placeholderTextColor="#6B7280"
            value={input}
            onChangeText={setInput}
          />
        </View>

        <TouchableOpacity
          style={[styles.iconButton, styles.sendButton]}
          onPress={sendMessage}
        >
          <Text style={styles.iconText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ⭐ PREMIUM CHAT UI ⭐
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
    paddingHorizontal: 12,
    paddingTop: 16,
  },

  header: {
    paddingHorizontal: 4,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 3,
  },

  chatCard: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  listContent: {
    paddingVertical: 10,
  },

  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginVertical: 6,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },

  user: {
    backgroundColor: "#2563EB",
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },

  ai: {
    backgroundColor: "#1E293B",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
  },

  text: {
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 22,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 10,
  },

  inputWrapper: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    marginHorizontal: 10,
  },

  input: {
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 10,
  },

  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },

  micButton: {
    backgroundColor: "#1E293B",
  },

  micActive: {
    backgroundColor: "#DC2626",
  },

  sendButton: {
    backgroundColor: "#2563EB",
  },

  iconText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
});
