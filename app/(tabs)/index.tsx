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
      content: "Hi! I’m your GPT Live prototype. Type to chat.",
    },
  ]);

  const [input, setInput] = useState("");

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text);
  };

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
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

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.send} onPress={sendMessage}>
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  bubble: {
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#2563EB",
    alignSelf: "flex-end",
  },
  ai: {
    backgroundColor: "#111827",
    alignSelf: "flex-start",
  },
  text: {
    color: "#fff",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#111827",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  send: {
    marginLeft: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
});
