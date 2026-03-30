const waitTime = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export default waitTime;
