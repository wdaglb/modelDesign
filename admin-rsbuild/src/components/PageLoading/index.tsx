const PageLoading = () => {
  return (
    <div className={'page-loading'}>
      <div className="spinner">
        <div className="double-bounce1"></div>
        <div className="double-bounce2"></div>
      </div>
      {/*<div className={styles.text}>页面加载中...</div>*/}
    </div>
  );
};

export default PageLoading;
