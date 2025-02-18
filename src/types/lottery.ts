export interface LotteryData {
  date: string;
  numbers: number[];
  bonusNumber?: number; // For 双色球's blue ball or 大乐透's blue balls
  bonusNumber2?: number; // For 大乐透's second blue ball
}

export interface ScrapedData {
  type: 'ssq' | 'dlt'; // ssq: 双色球, dlt: 大乐透
  data: LotteryData[];
}
