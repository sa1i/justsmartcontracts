type TRouteInfo = {
  path: string;
  title: string;
};

export const Routes: TRouteInfo[] = [
  {
    title: "Home",
    path: "/",
  },
  {
    title: "Deploy Contract",
    path: "/deploy",
  },
  {
    title: "Networks",
    path: "/networks",
  },
  {
    title: "ABI Manager",
    path: "/abi-manager",
  },
  // {
  //   title: 'Sign',
  //   path: '/sign',
  // },
];
