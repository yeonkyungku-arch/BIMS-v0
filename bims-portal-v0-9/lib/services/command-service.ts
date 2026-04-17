/**
 * Command Service
 * Shared service for operational command request handling
 * Used across: Dashboard, BIS device screen, Incident screen, Maintenance screen
 */

export type CommandType =
  | "DISPLAY_REFRESH"
  | "STATUS_CHECK"
  | "CONFIG_SYNC"
  | "COMM_RECONNECT"
  | "RUNTIME_RESTART"
  | "DEVICE_REBOOT"
  | "CREATE_WORKORDER";

export interface CommandRequest {
  deviceId: string;
  commandType: CommandType;
  timestamp: string;
  requestedBy?: string;
  reason?: string;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

/**
 * Command Service - Handles operational command requests
 * 모든 명령은 "요청" 형태로 진행되며, 실제 실행은 backend resolver에서 처리
 */
export const commandService = {
  /**
   * 디스플레이 새로고침 요청
   * e-Paper 디스플레이 갱신 요청
   */
  requestDisplayRefresh: async (deviceId: string): Promise<CommandResponse> => {
    try {
      const request: CommandRequest = {
        deviceId,
        commandType: "DISPLAY_REFRESH",
        timestamp: new Date().toISOString(),
      };

      // API 호출 (향후 실제 endpoint로 연결)
      console.log("[commandService] Display refresh requested:", request);
      
      return {
        success: true,
        message: `단말 ${deviceId}의 디스플레이 새로고침 요청이 등록되었습니다.`,
        requestId: `CMD-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Display refresh request failed:", error);
      return {
        success: false,
        message: "디스플레이 새로고침 요청 중 오류가 발생했습니다.",
      };
    }
  },

  /**
   * 상태 재조회 요청
   * 단말의 현재 상태를 즉시 조회
   */
  requestStatusCheck: async (deviceId: string): Promise<CommandResponse> => {
    try {
      const request: CommandRequest = {
        deviceId,
        commandType: "STATUS_CHECK",
        timestamp: new Date().toISOString(),
      };

      console.log("[commandService] Status check requested:", request);
      
      return {
        success: true,
        message: `단말 ${deviceId}의 상태 재조회 요청이 등록되었습니다.`,
        requestId: `CMD-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Status check request failed:", error);
      return {
        success: false,
        message: "상태 재조회 요청 중 오류가 발생했습니다.",
      };
    }
  },

  /**
   * 구성 재동기화 요청
   * 단말의 설정을 서버와 재동기화
   */
  requestConfigSync: async (deviceId: string): Promise<CommandResponse> => {
    try {
      const request: CommandRequest = {
        deviceId,
        commandType: "CONFIG_SYNC",
        timestamp: new Date().toISOString(),
      };

      console.log("[commandService] Config sync requested:", request);
      
      return {
        success: true,
        message: `단말 ${deviceId}의 구성 재동기화 요청이 등록되었습니다.`,
        requestId: `CMD-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Config sync request failed:", error);
      return {
        success: false,
        message: "구성 재동기화 요청 중 오류가 발생했습니다.",
      };
    }
  },

  /**
   * 런타임 재시작 요청
   * BIS 애플리케이션 재시작
   */
  requestRuntimeRestart: async (deviceId: string): Promise<CommandResponse> => {
    try {
      const request: CommandRequest = {
        deviceId,
        commandType: "RUNTIME_RESTART",
        timestamp: new Date().toISOString(),
      };

      console.log("[commandService] Runtime restart requested:", request);
      
      return {
        success: true,
        message: `단말 ${deviceId}의 런타임 재시작 요청이 등록되었습니다.`,
        requestId: `CMD-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Runtime restart request failed:", error);
      return {
        success: false,
        message: "런타임 재시작 요청 중 오류가 발생했습니다.",
      };
    }
  },

  /**
   * 통신 재연결 요청
   * 단말의 네트워크 연결을 재설정
   */
  requestCommReconnect: async (deviceId: string): Promise<CommandResponse> => {
    try {
      const request: CommandRequest = {
        deviceId,
        commandType: "COMM_RECONNECT",
        timestamp: new Date().toISOString(),
      };

      console.log("[commandService] Communication reconnect requested:", request);
      
      return {
        success: true,
        message: `단말 ${deviceId}의 통신 재연결 요청이 등록되었습니다.`,
        requestId: `CMD-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Communication reconnect request failed:", error);
      return {
        success: false,
        message: "통신 재연결 요청 중 오류가 발생했습니다.",
      };
    }
  },

  /**
   * 작업 생성 요청
   * 현장 점검/조치를 위한 작업지시 생성
   */
  requestCreateWorkOrder: async (
    deviceId: string,
    reason?: string
  ): Promise<CommandResponse> => {
    try {
      const request: CommandRequest = {
        deviceId,
        commandType: "CREATE_WORKORDER",
        timestamp: new Date().toISOString(),
        reason,
      };

      console.log("[commandService] Work order creation requested:", request);
      
      return {
        success: true,
        message: `단말 ${deviceId}에 대한 작업이 생성되었습니다.`,
        requestId: `WO-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Work order creation request failed:", error);
      return {
        success: false,
        message: "작업 생성 중 오류가 발생했습니다.",
      };
    }
  },

  /**
   * 단말 재부팅 요청
   * 전체 단말 재시작
   */
  requestDeviceReboot: async (deviceId: string): Promise<CommandResponse> => {
    try {
      const request: CommandRequest = {
        deviceId,
        commandType: "DEVICE_REBOOT",
        timestamp: new Date().toISOString(),
      };

      console.log("[commandService] Device reboot requested:", request);
      
      return {
        success: true,
        message: `단말 ${deviceId}의 재부팅 요청이 등록되었습니다. 약 2~3분이 소요될 수 있습니다.`,
        requestId: `CMD-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Device reboot request failed:", error);
      return {
        success: false,
        message: "재부팅 요청 중 오류가 발생했습니다.",
      };
    }
  },

  /**
   * 배치 명령 요청 - 여러 단말에 동일 명령 전송
   */
  requestBatchCommand: async (
    deviceIds: string[],
    commandType: CommandType
  ): Promise<CommandResponse> => {
    try {
      const requests: CommandRequest[] = deviceIds.map((deviceId) => ({
        deviceId,
        commandType,
        timestamp: new Date().toISOString(),
      }));

      console.log("[commandService] Batch command requested:", requests);
      
      return {
        success: true,
        message: `${deviceIds.length}개 단말의 ${commandType} 요청이 등록되었습니다.`,
        requestId: `BATCH-${Date.now()}`,
      };
    } catch (error) {
      console.error("[commandService] Batch command request failed:", error);
      return {
        success: false,
        message: "배치 명령 요청 중 오류가 발생했습니다.",
      };
    }
  },
};
