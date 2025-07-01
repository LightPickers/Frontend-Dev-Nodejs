function extractKeywords(message) {
  const keywordCandidates = [
    "Sony",
    "Canon",
    "Fujifilm",
    "富士",
    "Olympus",
    "Nikon",
    "Hasselblad",
    "Pentax",
    "Panasonic",
    "Lumix",
    "相機",
    "機身",
    "鏡頭",
    "類單眼",
    "閃光燈",
    "電池",
    "電池手把",
    "轉接器",
    "輕巧",
    "無反",
    "旁軸",
    "旗艦",
    "定焦",
    "變焦",
    "廣角",
    "遠攝",
    "防水",
    "全片幅",
    "中片幅",
    "大光圈",
    "淺景深",
    "影音",
    "Vlog",
    "4k",
    "8k",
    "α 系列",
    "復古",
    "戶外",
    "人像",
    "旅行",
    "街拍",
    "隨身",
  ];

  const lowerMessage = message.toLowerCase();
  const matches = keywordCandidates.filter((word) =>
    lowerMessage.includes(word.toLowerCase())
  );

  // console.log("使用者輸入：", message);
  // console.log("匹配到的關鍵字：", matches);

  return matches;
}

module.exports = extractKeywords;
