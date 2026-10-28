// src/app/[locale]/(chat)/rooms/components/utils.ts

export const getYouTubeID = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return { type: 'link', content: part, key: i };
    }
    return { type: 'text', content: part, key: i };
  });
};

export const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "ⵣ"];