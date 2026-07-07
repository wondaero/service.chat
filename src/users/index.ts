//유저리스트 조회
export const getUserList = () => {
  return [
    {
      이름: "abc",
      부서: "파트",
      직책: "직책",
      상태: "접속중",
    },
    {
      이름: "abc",
      부서: "파트",
      직책: "직책",
      상태: "접속중",
    },
    {
      이름: "abc",
      부서: "파트",
      직책: "직책",
      상태: "접속중",
    },
  ];
};
//유저 상세 조회
export const getUserDetail = (userId: string) => {
  return {
    이름: "abc",
    연락처: "010-0000-0000",
    부서: "파트",
    직책: "직책",
    상태: "휴가중",
  };
};

//로그인
export const login = (userId: string, password: string) => {
  //세션담기
};

interface User {
  userId: string;
  password: string;
  phone: string;
  부서?: string;
  직책?: string;
}

//회원가입
export const signUp = (user: User) => {};

//회원탈퇴
export const delUser = (userId: string, password: string) => {};
