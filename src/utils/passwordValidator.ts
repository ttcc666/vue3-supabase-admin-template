import type { PasswordValidationResult, PasswordRequirements } from '@/types/profile'
import { DEFAULT_PASSWORD_REQUIREMENTS } from '@/types/profile'

/**
 * 验证密码强度和要求
 * @param password 要验证的密码
 * @param requirements 密码要求配置
 * @returns 验证结果
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // 检查最小长度
  if (password.length < requirements.minLength) {
    errors.push(`密码长度至少需要 ${requirements.minLength} 个字符`)
  } else {
    score += 20
  }

  // 检查大写字母
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  } else if (/[A-Z]/.test(password)) {
    score += 15
  }

  // 检查小写字母
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  } else if (/[a-z]/.test(password)) {
    score += 15
  }

  // 检查数字
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  } else if (/\d/.test(password)) {
    score += 15
  }

  // 检查特殊字符
  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符')
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15
  }

  // 检查禁用密码
  const lowerPassword = password.toLowerCase()
  if (requirements.forbiddenPasswords.some(forbidden => 
    lowerPassword.includes(forbidden.toLowerCase())
  )) {
    errors.push('密码不能包含常见的弱密码')
    score = Math.max(0, score - 30)
  }

  // 额外的强度检查
  if (password.length >= 12) {
    score += 10
  }

  if (password.length >= 16) {
    score += 10
  }

  // 检查字符多样性
  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.7) {
    score += 10
  }

  // 确定强度等级
  let strength: 'weak' | 'medium' | 'strong'
  if (score < 40) {
    strength = 'weak'
  } else if (score < 70) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(100, score)
  }
}

/**
 * 获取密码强度颜色
 * @param strength 密码强度
 * @returns 对应的颜色
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return '#ff4d4f'
    case 'medium':
      return '#faad14'
    case 'strong':
      return '#52c41a'
    default:
      return '#d9d9d9'
  }
}

/**
 * 获取密码强度文本
 * @param strength 密码强度
 * @returns 对应的文本
 */
export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return '弱'
    case 'medium':
      return '中等'
    case 'strong':
      return '强'
    default:
      return '未知'
  }
}

/**
 * 生成密码强度提示
 * @param password 当前密码
 * @param requirements 密码要求
 * @returns 提示信息数组
 */
export function getPasswordStrengthTips(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string[] {
  const tips: string[] = []

  if (password.length < requirements.minLength) {
    tips.push(`至少需要 ${requirements.minLength} 个字符`)
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    tips.push('包含大写字母')
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    tips.push('包含小写字母')
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    tips.push('包含数字')
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    tips.push('包含特殊字符')
  }

  if (password.length >= 12) {
    tips.push('✓ 长度充足')
  }

  if (password.length >= 16) {
    tips.push('✓ 长度优秀')
  }

  return tips
}

/**
 * 检查两个密码是否匹配
 * @param password 密码
 * @param confirmPassword 确认密码
 * @returns 是否匹配
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0
}

/**
 * 生成安全的随机密码
 * @param length 密码长度
 * @param includeSymbols 是否包含特殊字符
 * @returns 生成的密码
 */
export function generateSecurePassword(length: number = 16, includeSymbols: boolean = true): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charset = lowercase + uppercase + numbers
  if (includeSymbols) {
    charset += symbols
  }

  let password = ''
  
  // 确保至少包含每种类型的字符
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)]
  }

  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }

  // 打乱密码字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
