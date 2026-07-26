declare module 'jstat' {
  const jStat: {
    normal: {
      pdf(x: number, mean?: number, std?: number): number;
      cdf(x: number, mean?: number, std?: number): number;
      inv(p: number, mean?: number, std?: number): number;
      sample(mean?: number, std?: number): number;
    };
    studentt: {
      pdf(x: number, df: number): number;
      cdf(x: number, df: number): number;
      inv(p: number, df: number): number;
    };
    chisquare: {
      pdf(x: number, df: number): number;
      cdf(x: number, df: number): number;
      inv(p: number, df: number): number;
    };
    centralF: {
      pdf(x: number, df1: number, df2: number): number;
      cdf(x: number, df1: number, df2: number): number;
      inv(p: number, df1: number, df2: number): number;
    };
    beta: {
      pdf(x: number, alpha: number, beta: number): number;
      cdf(x: number, alpha: number, beta: number): number;
      inv(p: number, alpha: number, beta: number): number;
    };
    [key: string]: unknown;
  };
  export { jStat };
}