function extractKeywords(message) {
  const keywordCandidates = [
    // 品牌 關鍵字
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
    // 品項類別 關鍵字
    "相機",
    "機身",
    "鏡頭",
    // 相機類型 關鍵字
    "單眼",
    "類單眼",
    "無反",
    "單反",
    "雙反",
    "旁軸",
    "閃光燈",
    "電池",
    "電池手把",
    "轉接器",
    "底片",
    "數位",
    // 鏡頭 關鍵字
    "可換鏡頭",
    "固定鏡頭",
    "定焦",
    "變焦",
    "廣角",
    "遠攝",
    // 畫幅的尺寸規格
    "大畫幅",
    "中畫幅",
    "110",
    "120",
    "135",
    "APS",
    "微型",
    "全片幅",
    "中片幅",
    // 光圈
    "大光圈",
    "淺景深",
    // 用途
    "戶外",
    "人像",
    "旅行",
    "街拍",
    "隨身",
    "影音",
    "Vlog",
    "防水",
    "復古",
    // 規格
    "4k",
    "8k",
    "輕巧",
    "旗艦",
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
