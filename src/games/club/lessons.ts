export interface Quiz {
  q: string;
  choices: string[];
  why: string;
}
const question = (q: string, answers: string, why: string): Quiz => ({
  q,
  choices: answers.split("|"),
  why,
});
export const quizzes = [
  [
    question(
      "Hành tinh nào là nơi chúng ta đang sống?",
      "Trái Đất|Sao Hỏa|Sao Kim|Sao Thủy",
      "Trái Đất là hành tinh thứ ba tính từ Mặt Trời.",
    ),
    question(
      "Một giờ có bao nhiêu phút?",
      "60|24|30|100",
      "Mỗi giờ bằng 60 phút.",
    ),
    question(
      "Từ nào chỉ hoạt động?",
      "Chạy|Cây|Đỏ|Tròn",
      "Chạy là một động từ.",
    ),
    question(
      "Một tuần lễ có bao nhiêu ngày?",
      "7|5|6|8",
      "Một tuần gồm 7 ngày từ Thứ Hai đến Chủ Nhật.",
    ),
    question(
      "Nước đóng băng thành đá ở nhiệt độ nào?",
      "0°C|10°C|50°C|100°C",
      "Ở áp suất chuẩn, nước chuyển từ lỏng sang rắn ở 0°C.",
    ),
  ],
  [
    question(
      "Một tam giác có bao nhiêu cạnh?",
      "3|4|5|6",
      "Ba đoạn thẳng khép kín tạo thành tam giác.",
    ),
    question(
      "Rễ cây hút gì từ đất?",
      "Nước và muối khoáng|Ánh sáng|Đường|Khí heli",
      "Rễ lấy nước và chất khoáng hòa tan để nuôi cây.",
    ),
    question(
      "Từ nào nghĩa là thư viện trong tiếng Anh?",
      "Library|Kitchen|Garden|Bridge",
      "Library là nơi lưu trữ và cho mượn sách.",
    ),
    question(
      "Loài chim nào không biết bay nhưng bơi rất giỏi?",
      "Chim cánh cụt|Chim sẻ|Chim ưng|Chim bồ câu",
      "Cánh của chim cánh cụt tiến hóa như mái chèo để bơi dưới nước.",
    ),
    question(
      "Dấu câu nào thường đặt cuối câu hỏi?",
      "Dấu chấm hỏi (?)|Dấu phẩy (,)|Dấu hai chấm (:)|Dấu chấm phẩy (;)",
      "Dấu chấm hỏi đánh dấu câu nghi vấn.",
    ),
  ],
  [
    question(
      "Một phần tư của 36 là bao nhiêu?",
      "9|6|12|18",
      "Chia 36 thành 4 phần bằng nhau, mỗi phần là 9.",
    ),
    question(
      "Thể lục bát ghép dòng sáu tiếng với dòng mấy tiếng?",
      "Tám|Năm|Bảy|Chín",
      "Lục là sáu, bát là tám.",
    ),
    question(
      "Nhiệt kế dùng để đo gì?",
      "Nhiệt độ|Áp suất|Khối lượng|Thời gian",
      "Nhiệt kế cho biết mức nóng, lạnh.",
    ),
    question(
      "Hành tinh nào lớn nhất trong Hệ Mặt Trời?",
      "Sao Mộc|Sao Thổ|Trái Đất|Sao Hỏa",
      "Sao Mộc là hành tinh khí khổng lồ lớn nhất Hệ Mặt Trời.",
    ),
    question(
      "Chọn từ trái nghĩa với “kiên nhẫn”.",
      "Nóng vội|Điềm tĩnh|Chăm chỉ|Nhẹ nhàng",
      "Nóng vội là vội vàng, thiếu kiên trì chờ đợi.",
    ),
  ],
  [
    question(
      "Chu vi hình vuông cạnh 7 cm là bao nhiêu?",
      "28 cm|49 cm|14 cm|21 cm",
      "Chu vi hình vuông bằng bốn lần độ dài một cạnh.",
    ),
    question(
      "Cơ quan nào bơm máu?",
      "Tim|Phổi|Gan|Dạ dày",
      "Tim co bóp để đẩy máu đi khắp cơ thể.",
    ),
    question(
      "Chọn dạng quá khứ của go.",
      "Went|Gone|Going|Goes",
      "Went là dạng quá khứ đơn của go.",
    ),
    question(
      "Diện tích hình chữ nhật dài 8 cm, rộng 5 cm là bao nhiêu?",
      "40 cm²|26 cm²|13 cm²|35 cm²",
      "Diện tích hình chữ nhật bằng chiều dài nhân chiều rộng: 8 × 5 = 40 cm².",
    ),
    question(
      "Hiện tượng cầu vồng xuất hiện chủ yếu do tính chất nào của ánh sáng?",
      "Tán sắc ánh sáng|Phản xạ âm|Từ trường|Hấp thụ nhiệt",
      "Ánh sáng mặt trời đi qua giọt nước mưa bị khúc xạ và tán sắc thành dải màu.",
    ),
  ],
  [
    question(
      "Số nguyên tố nhỏ nhất là số nào?",
      "2|0|1|3",
      "2 có đúng hai ước dương là 1 và 2.",
    ),
    question(
      "Chất khí nào cần cho sự hô hấp của người?",
      "Ôxy|Nitơ|Mêtan|Heli",
      "Tế bào dùng ôxy để giải phóng năng lượng từ chất dinh dưỡng.",
    ),
    question(
      "Biện pháp nào so sánh hai sự vật bằng từ như?",
      "So sánh|Nhân hóa|Điệp từ|Liệt kê",
      "Từ như nối hai vế để làm nổi bật nét tương đồng.",
    ),
    question(
      "Tổng các góc trong của một tứ giác bất kỳ bằng bao nhiêu độ?",
      "360°|180°|270°|540°",
      "Một tứ giác có thể chia thành hai tam giác, nên tổng góc là 2 × 180° = 360°.",
    ),
    question(
      "Trong máy tính, 1 kilobyte (theo chuẩn nhị phân KiB) gồm bao nhiêu byte?",
      "1024|512|256|2048",
      "2¹⁰ = 1024 byte.",
    ),
  ],
  [
    question(
      "Nếu x + 7 = 3x − 1 thì x bằng bao nhiêu?",
      "4|3|6|8",
      "Chuyển vế được 2x = 8, nên x = 4.",
    ),
    question(
      "Trong mạch điện đơn giản, vật nào thường dẫn điện tốt?",
      "Dây đồng|Thước nhựa|Gỗ khô|Cục tẩy",
      "Đồng là kim loại có các electron di chuyển dễ dàng.",
    ),
    question(
      "Câu điều kiện có thực dùng cụm nào? If it rains, I … home.",
      "will stay|would stayed|staying|have stay",
      "Mệnh đề chính của câu điều kiện loại một thường dùng will và động từ nguyên thể.",
    ),
    question(
      "Giá trị của 2⁵ − 3² là bao nhiêu?",
      "23|25|19|27",
      "2⁵ = 32 và 3² = 9, nên 32 − 9 = 23.",
    ),
    question(
      "Khi giảm kích thước một khối lập phương cạnh xuống một nửa, thể tích thay đổi thế nào?",
      "Giảm 8 lần|Giảm 2 lần|Giảm 4 lần|Giảm 6 lần",
      "Thể tích tỉ lệ với lập phương cạnh: (1/2)³ = 1/8.",
    ),
  ],
];
export const typingLines = [
  [
    "Mây nhẹ qua đồi",
    "Lật từng trang sách",
    "Gió về trong vườn",
    "Uống một ngụm nước mát",
    "Ngồi thẳng lưng thật êm",
  ],
  [
    "Mỗi ngày một ý tưởng",
    "Cất bút lên giá sách",
    "Từng bước nhỏ đều đáng quý",
    "Đọc chậm để hiểu thật sâu",
    "Ánh đèn vàng ấm áp góc bàn",
  ],
  [
    "Nắng sớm đánh thức khu vườn",
    "Bạn nhỏ nghiêng đầu đọc sách",
    "Ghi chú giúp mình nhớ lâu",
    "Một câu hỏi hay mở ra chân trời mới",
    "Sau mỗi giờ học hãy nhìn ra khung cửa",
  ],
  [
    "Trước khi bắt đầu, hãy chọn một mục tiêu.",
    "Gấp cuốn sổ lại và hít thở thật chậm.",
    "Hôm nay, mình học một điều mới.",
    "Vươn vai một chút để tinh thần tỉnh táo.",
    "Sự đều đặn quan trọng hơn tốc độ nhất thời.",
  ],
  [
    "Khi gặp bài khó, mình thử tách thành những câu hỏi nhỏ.",
    "Sau một phiên tập trung, đôi mắt cũng cần nghỉ ngơi.",
    "Thảo luận cùng bạn giúp mình hiểu nhiều góc nhìn.",
    "Viết lại kiến thức bằng lời của mình giúp nhớ lâu hơn.",
    "Không cần hoàn hảo ngay, chỉ cần kiên trì từng bước.",
  ],
  [
    "Một lời giải hay không chỉ có đáp số, mà còn giải thích được từng bước.",
    "Đọc lại ghi chú sau buổi học giúp mình nhận ra điều còn chưa rõ.",
    "Những ý tưởng lớn đôi khi bắt đầu từ một câu hỏi rất giản dị.",
    "Dành hai mươi phút trọn vẹn cho một việc sẽ mang lại sự bình yên bất ngờ.",
    "Khi ta học với sự tò mò, mỗi trang sách đều trở thành một cuộc phiêu lưu.",
  ],
];
export function editDistance(a: string, b: string) {
  const left = Array.from(a),
    right = Array.from(b);
  let row = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 0; i < left.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < right.length; j++)
      next.push(
        Math.min(
          next[j] + 1,
          row[j + 1] + 1,
          row[j] + Number(left[i] !== right[j]),
        ),
      );
    row = next;
  }
  return row[right.length];
}
export const ink = [
  ["Hổ phách", "#d09048", "dots"],
  ["Lam biển", "#4685aa", "stripes"],
  ["Lá non", "#669669", "cross"],
  ["Tím nho", "#9375a9", "dots"],
  ["Hồng đào", "#be777f", "stripes"],
  ["Xanh ngọc", "#3b9389", "cross"],
  ["Cà phê", "#967858", "stripes"],
  ["Chàm", "#596d9c", "dots"],
] as const;
export const shapes = [
  [
    [0, 0],
    [1, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
] as const;
export type Offset = readonly [number, number];
export function rotate(piece: readonly Offset[]): Offset[] {
  const maxY = Math.max(...piece.map((p) => p[1]));
  return piece.map(([x, y]) => [maxY - y, x]);
}
export function place(
  cells: number[],
  side: number,
  piece: readonly Offset[],
  anchor: number,
  color: number,
) {
  const ox = anchor % side,
    oy = Math.floor(anchor / side);
  if (
    piece.some(
      ([x, y]) =>
        ox + x >= side || oy + y >= side || cells[(oy + y) * side + ox + x],
    )
  )
    return null;
  const next = [...cells];
  for (const [x, y] of piece) next[(oy + y) * side + ox + x] = color;
  const clear = new Set<number>();
  let lines = 0;
  for (let i = 0; i < side; i++)
    for (const vertical of [false, true]) {
      const ids = Array.from({ length: side }, (_, j) =>
        vertical ? j * side + i : i * side + j,
      );
      if (ids.every((k) => next[k])) {
        lines++;
        ids.forEach((k) => clear.add(k));
      }
    }
  clear.forEach((k) => (next[k] = 0));
  return { next, lines };
}
