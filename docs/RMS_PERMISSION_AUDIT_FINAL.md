# RMS 권한 검토 최종 보고서

## 검토 결과

현재 Super Admin(`tpl_platform_super_admin`) 역할에는 다음의 **RMS 권한이 모두 정의되어 있습니다:**

```
- rms.device.read ✓
- rms.device.control ✓  
- rms.device.command ✓
- rms.alert.read ✓
- rms.alert.update ✓
- rms.alert.close ✓
- rms.command.create ✓
- rms.command.approve ✓
- rms.battery.read ✓
- rms.communication.read ✓
```

## 수정된 사항

### 1. Action Catalog 확장
- `rms.alert.read`, `rms.alert.update`, `rms.alert.close` 추가
- `rms.command.create`, `rms.command.approve` 추가
- `rms.battery.read`, `rms.communication.read` 추가

### 2. Role Templates 권한 추가

**Super Admin (tpl_platform_super_admin)**
- 모든 RMS 권한 포함 (device, alert, command, battery, communication)

**Platform Admin (tpl_platform_admin)**  
- `rms.device.read`, `rms.device.command`, `rms.device.control`
- `rms.alert.read`, `rms.alert.update`
- `rms.command.create`
- `rms.battery.read`, `rms.communication.read`

**Customer Admin (tpl_customer_admin)**
- `rms.device.read`
- `rms.alert.read`, `rms.alert.update`
- `rms.command.create`
- `rms.battery.read`, `rms.communication.read`

**Maintenance Operator (tpl_maintenance_operator)**
- `rms.device.read`, `rms.device.control`, `rms.device.command`
- `rms.alert.read`, `rms.alert.update`
- `rms.command.create`
- `rms.battery.read`, `rms.communication.read`

**Municipality Viewer (tpl_municipality_viewer)**
- `rms.device.read`
- `rms.alert.read`
- `rms.battery.read`, `rms.communication.read`

### 3. 페이지 권한 체크 수정

| 페이지 | 권한 체크 | 상태 |
|-------|---------|------|
| /rms/devices | `rms.device.read` | ✓ 정확함 |
| /rms/monitoring | `rms.device.read` | ✓ 정확함 |
| /rms/alert-center | `rms.alert.read` | ✓ 정확함 |
| /rms/battery | ~~`rms.device.read`~~ → `rms.battery.read` | ✓ 수정됨 |
| /rms/communication | ~~`rms.device.read`~~ → `rms.communication.read` | ✓ 수정됨 |
| /rms/commands | `rms.command.create` | ✓ 정확함 |
| /rms/ota | `rms.device.control` | ✓ 정확함 |

## 권한 구조 설계 원칙

1. **최소 권한 원칙**: 각 역할은 필요한 최소 권한만 보유
2. **기능 중심**: 도메인(rms) + 리소스(device, alert, command, battery, communication) + 동작(read, write, approve)
3. **계층적 권한**: Super Admin > Platform Admin > Customer Admin > Operators > Viewers
4. **Scope 기반 제한**: 역할별 허용된 Scope에 따라 데이터 가시성 제어

## 향후 개선 사항

1. Scope-based RBAC 강화: 현재는 role만 기반이며, scope 기반 데이터 필터링은 추가 구현 필요
2. OTA (Over-The-Air) 권한 확장: 현재 `rms.device.control`만으로 제어 - 더 세분화된 권한 필요할 수 있음
3. 감사 로그: 모든 RMS 중요 액션에 대한 감사 기록 추가 필요
4. 권한 위임(Delegation): Customer Admin이 하위 사용자에게 권한을 위임할 수 있는 기능
