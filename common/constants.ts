export const PROJECT_STATUS = {
    PENDING: 'PENDING',
    PREPARING: 'PREPARING',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED'
} as const;

// 2. 화면 표출용 한글 매핑 딕셔너리
export const PROJECT_STATUS_KO = {
    [PROJECT_STATUS.PENDING]: '대기',
    [PROJECT_STATUS.PREPARING]: '준비',
    [PROJECT_STATUS.ONGOING]: '진행중',
    [PROJECT_STATUS.COMPLETED]: '완료'
};