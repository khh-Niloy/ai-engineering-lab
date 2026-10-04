import { IntentType } from './enum';

export const intentConfig = {
  [IntentType.ORDER_STATUS]: {
    keywords: ['where is my order', 'order status', 'track my order'],
    context: ['customer', 'orders'],
  },

  [IntentType.ORDER_CANCEL]: {
    keywords: ['cancel my order', 'cancel order'],
    context: ['customer', 'orders'],
  },

  [IntentType.RETURN]: {
    keywords: ['return my product', 'return this', 'return an item'],
    context: ['customer', 'orders', 'products'],
  },

  [IntentType.REFUND]: {
    keywords: ['refund', 'money back', 'refund status'],
    context: ['customer', 'orders', 'refunds'],
  },

  [IntentType.PRODUCT]: {
    keywords: ['product', 'price', 'available', 'details'],
    context: ['products'],
  },

  [IntentType.ACCOUNT]: {
    keywords: ['login', 'log in', 'password', 'account'],
    context: ['customer'],
  },

  [IntentType.PAYMENT]: {
    keywords: ['charged', 'payment', 'paid', 'credit card'],
    context: ['customer', 'orders'],
  },

  [IntentType.GENERAL]: {
    keywords: [],
    context: [],
  },
};
