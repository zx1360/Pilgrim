export const processContent = (content) => {
  if (!content) return { texts: [], images: [] };
  
  const paragraphs = content.split(/\r?\n/);
  const texts = [];
  const images = [];
  
  paragraphs.forEach(paragraph => {
    const trimmed = paragraph.trim();
    if (trimmed.startsWith('![')) {
      images.push(trimmed);
    } else if (trimmed.startsWith('!|')) {
      images.push(trimmed);
    } else {
      texts.push(paragraph);
    }
  });
  
  return { texts, images };
};

export const extractImageUrl = (imageText) => {
  if (imageText.startsWith('![')) {
    const regex = /!\[(.*?)\]\((.*?)\)/;
    const match = imageText.match(regex);
    return match ? match[2] : '';
  } else if (imageText.startsWith('!|')) {
    const regex = /!\|(.*?)\|<(.*?)>/;
    const match = imageText.match(regex);
    return match ? match[2] : '';
  }
  return '';
};

export const extractImageAlt = (imageText) => {
  if (imageText.startsWith('![')) {
    const regex = /!\[(.*?)\]\((.*?)\)/;
    const match = imageText.match(regex);
    return match ? match[1] : '文章图片';
  } else if (imageText.startsWith('!|')) {
    const regex = /!\|(.*?)\|<(.*?)>/;
    const match = imageText.match(regex);
    return match ? match[1] : '文章图片';
  }
  return '文章图片';
};