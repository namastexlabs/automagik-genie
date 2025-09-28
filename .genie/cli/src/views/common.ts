import { ViewEnvelope, ViewStyle } from '../view';

export function buildErrorView(style: ViewStyle, title: string, message: string): ViewEnvelope {
  return {
    style,
    title,
    body: {
      type: 'callout',
      tone: 'danger',
      title,
      body: [message]
    }
  };
}

export function buildWarningView(style: ViewStyle, title: string, messages: string[]): ViewEnvelope {
  return {
    style,
    title,
    body: {
      type: 'callout',
      tone: 'warning',
      title,
      body: messages
    }
  };
}

export function buildInfoView(style: ViewStyle, title: string, messages: string[]): ViewEnvelope {
  return {
    style,
    title,
    body: {
      type: 'callout',
      tone: 'info',
      title,
      body: messages
    }
  };
}
