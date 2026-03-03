/**
 * Manus API クレジット消費試算
 * 
 * 各処理のクレジット消費を計算
 */

export interface CreditEstimate {
  operation: string;
  creditsPerOperation: number;
  frequency: string;
  weeklyCount: number;
  weeklyCredits: number;
  monthlyCount: number;
  monthlyCredits: number;
  yearlyCount: number;
  yearlyCredits: number;
}

export interface TotalCreditEstimate {
  estimates: CreditEstimate[];
  weeklyTotal: number;
  monthlyTotal: number;
  yearlyTotal: number;
  notes: string[];
}

/**
 * クレジット消費試算を計算
 */
export function estimateCreditUsage(): TotalCreditEstimate {
  const estimates: CreditEstimate[] = [];

  // 1. レシート分析（LLM + Vision）
  // - 1回のレシート分析：約10クレジット（LLM + 画像処理）
  // - 週4回、月16回、年208回
  estimates.push({
    operation: "レシート分析（LLM + Vision）",
    creditsPerOperation: 10,
    frequency: "週4回",
    weeklyCount: 4,
    weeklyCredits: 40,
    monthlyCount: 16,
    monthlyCredits: 160,
    yearlyCount: 208,
    yearlyCredits: 2080,
  });

  // 2. チラシ取得・分析（LLM + Vision）
  // - 1回のチラシ分析：約15クレジット（複数画像処理）
  // - 週1回（複数店舗）、月4回、年52回
  // - 店舗数3店舗を想定
  estimates.push({
    operation: "チラシ取得・分析（LLM + Vision）",
    creditsPerOperation: 15,
    frequency: "週3回（3店舗）",
    weeklyCount: 3,
    weeklyCredits: 45,
    monthlyCount: 12,
    monthlyCredits: 180,
    yearlyCount: 156,
    yearlyCredits: 2340,
  });

  // 3. マッチング分析（LLM）
  // - 1回のマッチング分析：約5クレジット
  // - 週1回、月4回、年52回
  estimates.push({
    operation: "マッチング分析（LLM）",
    creditsPerOperation: 5,
    frequency: "週1回",
    weeklyCount: 1,
    weeklyCredits: 5,
    monthlyCount: 4,
    monthlyCredits: 20,
    yearlyCount: 52,
    yearlyCredits: 260,
  });

  // 4. LINE通知送信
  // - 1回の通知送信：約0.5クレジット（API呼び出し）
  // - 週1回、複数デバイス対応（平均2デバイス）
  estimates.push({
    operation: "LINE通知送信",
    creditsPerOperation: 0.5,
    frequency: "週1回（2デバイス）",
    weeklyCount: 2,
    weeklyCredits: 1,
    monthlyCount: 8,
    monthlyCredits: 4,
    yearlyCount: 104,
    yearlyCredits: 52,
  });

  // 5. データベースクエリ・ストレージ操作
  // - 各操作：約0.1クレジット
  // - 日々の操作を想定
  estimates.push({
    operation: "データベース・ストレージ操作",
    creditsPerOperation: 0.1,
    frequency: "日々",
    weeklyCount: 7,
    weeklyCredits: 0.7,
    monthlyCount: 30,
    monthlyCredits: 3,
    yearlyCount: 365,
    yearlyCredits: 36.5,
  });

  // 合計を計算
  const weeklyTotal = estimates.reduce((sum, e) => sum + e.weeklyCredits, 0);
  const monthlyTotal = estimates.reduce((sum, e) => sum + e.monthlyCredits, 0);
  const yearlyTotal = estimates.reduce((sum, e) => sum + e.yearlyCredits, 0);

  const notes = [
    "※ 上記はあくまで推定値です。実際のクレジット消費は処理内容により変動します。",
    "※ レシート分析：週4回の制限内での使用を想定",
    "※ チラシ取得：3店舗（フィール野田、ベイシア名古屋港、業務スーパー黄金）の自動取得を想定",
    "※ LINE通知：毎週金曜日夜8時に1回送信、複数デバイス対応を想定",
    "※ 推定月額クレジット消費：約167クレジット",
    "※ 推定年額クレジット消費：約2,768.5クレジット",
    "※ 複数ユーザー対応の場合、ユーザー数に応じてクレジット消費が増加します。",
  ];

  return {
    estimates,
    weeklyTotal,
    monthlyTotal,
    yearlyTotal,
    notes,
  };
}

/**
 * クレジット消費試算を表示用フォーマットで返す
 */
export function formatCreditEstimate(estimate: TotalCreditEstimate): string {
  let result = "## クレジット消費試算\n\n";

  result += "### 操作別クレジット消費\n\n";
  result += "| 操作 | 1回 | 頻度 | 週間 | 月間 | 年間 |\n";
  result += "|------|-----|------|------|------|------|\n";

  for (const e of estimate.estimates) {
    result += `| ${e.operation} | ${e.creditsPerOperation} | ${e.frequency} | ${e.weeklyCredits} | ${e.monthlyCredits} | ${e.yearlyCredits} |\n`;
  }

  result += "\n### 合計クレジット消費\n\n";
  result += `- **週間**: ${estimate.weeklyTotal.toFixed(1)} クレジット\n`;
  result += `- **月間**: ${estimate.monthlyTotal.toFixed(1)} クレジット\n`;
  result += `- **年間**: ${estimate.yearlyTotal.toFixed(1)} クレジット\n\n`;

  result += "### 注記\n\n";
  for (const note of estimate.notes) {
    result += `${note}\n`;
  }

  return result;
}

/**
 * 複数ユーザー対応時のクレジット消費を計算
 */
export function estimateCreditForMultipleUsers(
  userCount: number,
  estimate: TotalCreditEstimate
): TotalCreditEstimate {
  return {
    estimates: estimate.estimates.map((e) => ({
      ...e,
      weeklyCredits: e.weeklyCredits * userCount,
      monthlyCredits: e.monthlyCredits * userCount,
      yearlyCredits: e.yearlyCredits * userCount,
    })),
    weeklyTotal: estimate.weeklyTotal * userCount,
    monthlyTotal: estimate.monthlyTotal * userCount,
    yearlyTotal: estimate.yearlyTotal * userCount,
    notes: [
      ...estimate.notes,
      `※ ${userCount}ユーザーでの使用を想定した試算です。`,
    ],
  };
}
