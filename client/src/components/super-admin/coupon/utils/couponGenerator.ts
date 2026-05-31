// src/utils/coupon/couponGenerator.ts
export const generateCouponCode = (): string => {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';


  const getRandomChar = (chars: string) =>
    chars.charAt(Math.floor(Math.random() * chars.length));

  // Generate pattern: CVC-CVC-XX
  const generatePart = (length: number, pattern: 'cvc' = 'cvc') => {
    let result = '';
    for (let i = 0; i < length; i++) {
      if (pattern === 'cvc') {
        result += i % 2 === 0
          ? getRandomChar(consonants)
          : getRandomChar(vowels);
      }
    }
    return result;
  };

  const part1 = generatePart(3);
  const part2 = generatePart(3);
  const part3 = Math.floor(10 + Math.random() * 90);

  return `${part1}-${part2}-${part3}`;
};

export const validateGeneratedCode = (code: string): boolean => {
  const pattern = /^[A-Z]{3}-[A-Z]{3}-\d{2}$/;
  return pattern.test(code);
};