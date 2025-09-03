export interface BaseResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  timestamp: string;
}

export function buildResponse<T>(options: {
  data?: T;
  message?: string;
  success?: boolean;
  errorCode?: string;
}): BaseResponse<T> {
  const { data, message, success = true, errorCode } = options;
  return {
    success,
    message,
    data,
    errorCode,
    timestamp: new Date().toISOString(),
  };
}


