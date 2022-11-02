<div className={styles.eidbox}>
    <div>
        {/* <div className={styles.enterpriseInfo}>
            <img src={EnterpriseInfo} alt="" />
            <span>
                <FormattedMessage id="enterpriseOverview.information.message" />
            </span>
        </div> */}
        
        
    </div>
    <div>
        <img
            src={EnterpriseBj}
            alt=""
            style={{ marginRight: '54px' }}
        />
    </div>
</div>
<div>
          {this.state.adminer && (
            <Row
              style={{
                marginBottom: 24
              }}
            >
              <Col span={13}>
                <Card
                  bordered={false}
                  loading={overviewAppInfoLoading}
                  style={{
                    height: '243px',
                    marginRight: '25px'
                  }}
                >
                  <Row style={{ marginBottom: '6px' }}>
                    <Col className={styles.grays} span={12}>
                      {/* 应用数量 */}
                      <FormattedMessage id="enterpriseOverview.app.number" />
                    </Col>
                    <Col className={styles.grays} span={12}>
                      {/* 组件数量 */}
                      <FormattedMessage id="enterpriseOverview.module.number" />
                    </Col>
                  </Row>
                  <Row>
                    <Col span={8}>
                      <Pie
                        percent={
                          Math.round((runApp / appTotal) * 10000) / 100.0
                        }
                        types="app"
                        lineWidth={18}
                        color="#3D58DA"
                        subTitle={
                          <div className={styles.appContent}>
                            <h6>{runApp} {language ? formatMessage({ id: 'unit.entries' }) : ''}</h6>
                            <div>
                              {/*  共{appTotal}
                              应用数量 */}
                              <FormattedMessage
                                id="enterpriseOverview.app.overview"
                                values={{ number: appTotal }}
                              />
                            </div>
                          </div>
                        }
                        height={168}
                      />
                    </Col>

                    <Col span={4}>
                      <div>
                        <div>
                          <div className={styles.appnumno}>
                            {/* 运行中应用 */}
                            <FormattedMessage id="enterpriseOverview.app.run" />
                          </div>
                          <div className={styles.nums}>
                            <span>{runApp} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                            <span>|</span>
                            <span>{appTotal} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                          </div>
                        </div>
                        <div>
                          <div
                            className={styles.appnums}
                            style={{ marginTop: '26px' }}
                          >
                            {/* 未运行应用 */}
                            <FormattedMessage id="enterpriseOverview.app.notrun" />
                          </div>
                          <div className={styles.nums}>
                            <span>{appClosed} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                            <span>|</span>
                            <span>{appTotal} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginTop: '10px' }}>
                        <Pie
                          percent={
                            Math.round((runCom / comTotal) * 10000) / 100.0
                          }
                          types="component"
                          color="#3D58DA"
                          subTitle={
                            <div className={language ? styles.elements : styles.en_elements}>
                              <div>
                                <div>{comClosed}</div>
                                <div>
                                  {/* 未运行 */}
                                  <FormattedMessage id="enterpriseOverview.module.notrun" />
                                </div>
                              </div>
                              <div />
                              <div>
                                <div>{runCom}</div>
                                <div>
                                  {/* 运行中 */}
                                  <FormattedMessage id="enterpriseOverview.module.run" />
                                </div>
                              </div>
                            </div>
                          }
                          height={156}
                        />
                      </div>
                    </Col>
                    <Col span={4}>
                      <div>
                        <div>
                          <div className={styles.appnumno}>
                            {/* 运行中组件 */}
                            <FormattedMessage id="enterpriseOverview.module.run.component" />
                          </div>
                          <div className={styles.nums}>
                            <span>{runCom} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                            <span>|</span>
                            <span>{comTotal} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                          </div>
                        </div>
                        <div>
                          <div
                            className={styles.appnums}
                            style={{ marginTop: '26px' }}
                          >
                            {/* 未运行组件 */}
                            <FormattedMessage id="enterpriseOverview.module.notrun.component" />
                          </div>
                          <div className={styles.nums}>
                            <span>{comClosed} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                            <span>|</span>
                            <span>{comTotal} {language ? formatMessage({ id: 'unit.entries' }) : ''}</span>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={11}>
                <Card
                  bordered={false}
                  loading={overviewInfoLoading}
                  style={{ height: '243px' }}
                >
                  <Row>
                    <Col span={7}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={Element} alt="" />
                          </div>
                        </li>
                        <li>
                          <Link
                            to={`/enterprise/${eid}/shared/local`}
                            style={colors}
                          >
                            {overviewInfo && overviewInfo.shared_apps}
                          </Link>
                        </li>
                        <li>
                          {/* 应用模版数量 */}
                          <FormattedMessage id="enterpriseOverview.overview.template" />
                        </li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={10}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={Team} alt="" />
                          </div>
                        </li>
                        <li>
                          <Link to={`/enterprise/${eid}/teams`} style={colors}>
                            {overviewInfo && overviewInfo.total_teams}
                          </Link>
                        </li>

                        <li>
                          {/* 团队数量 */}
                          <FormattedMessage id="enterpriseOverview.overview.team" />
                        </li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={7}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={User} alt="" />
                          </div>
                        </li>
                        <li>
                          <Link to={`/enterprise/${eid}/users`} style={colors}>
                            {overviewInfo && overviewInfo.total_users}
                          </Link>
                        </li>
                        <li>
                          {/* 用户数量 */}
                          <FormattedMessage id="enterpriseOverview.overview.user" />
                        </li>
                        <li>——</li>
                      </ul>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          )}

          <Row
            style={{
              marginBottom: 24
            }}
          >
            <Col span={13}>
              <Card
                bordered={false}
                loading={overviewTeamInfoLoading}
                style={{ height: '243px', marginRight: '25px' }}
              >
                <Row style={{ marginBottom: '4px' }}>
                  <Col className={styles.grays} span={12}>
                    {/* 团队 */}
                    <FormattedMessage id="enterpriseOverview.team.group" />
                  </Col>

                  {active_teams ? (
                    <Col
                      className={styles.grays}
                      span={12}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* 常用团队 */}
                      <FormattedMessage id="enterpriseOverview.team.frequently" />
                      <Link style={colors} to={`/enterprise/${eid}/teams`}>
                        <FormattedMessage id="enterpriseOverview.team.more" />
                        {/* 更多 */}
                      </Link>
                    </Col>
                  ) : (
                    <Col
                      className={styles.grays}
                      span={12}
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <span style={colors} onClick={this.onJoinTeam}>
                        {/* 加入团队 */}
                        <FormattedMessage id="enterpriseOverview.team.join" />
                      </span>

                      {this.state.adminer && (
                        <span
                          style={{
                            color: '#3D54C4',
                            marginLeft: '5px',
                            cursor: 'pointer'
                          }}
                          onClick={this.onAddTeam}
                        >
                          {/*  创建团队 */}
                          <FormattedMessage id="enterpriseOverview.team.setup" />
                        </span>
                      )}
                    </Col>
                  )}
                </Row>

                {active_teams ? (
                  <Row>
                    <Col span={12}>
                      {new_join_team && (
                        <Card
                          hoverable
                          bodyStyle={teamBoxs}
                          bordered={false}
                          onClick={() => {
                            this.props.dispatch(
                              routerRedux.push(
                                `/team/${new_join_team[0].team_name}/region/${new_join_team[0].region}/index`
                              )
                            );
                          }}
                        >
                          <div className={styles.addTeam}>
                            <img
                              onClick={() => {
                                this.props.dispatch(
                                  routerRedux.push(
                                    `/team/${new_join_team[0].team_name}/region/${new_join_team[0].region}/index`
                                  )
                                );
                              }}
                              src={TeamCrew}
                              alt=""
                            />
                          </div>
                          <Tooltip title={<FormattedMessage id="enterpriseOverview.team.new" />}>
                            <div
                              className={`${styles.grays} ${styles.addteam}`}
                            >
                              {/* 新加入团队: */}
                              <FormattedMessage id="enterpriseOverview.team.new" />

                            </div>
                          </Tooltip>

                          <Tooltip title={new_join_team[0].team_alias}>
                            <div
                              className={`${styles.overText} ${styles.teamtest}`}
                            >
                              {new_join_team[0].team_alias}
                            </div>
                          </Tooltip>
                          <div>
                            <img src={Arrow} alt="" />
                          </div>
                        </Card>
                      )}
                      <Card hoverable bodyStyle={teamBoxs} bordered={false}>
                        {teamOperation}
                      </Card>
                    </Col>
                    <Col span={11} offset={1}>
                      {active_teams.map(item => {
                        const { team_name, region, team_alias } = item;
                        return (
                          <Card
                            hoverable
                            key={team_name}
                            bodyStyle={teamBoxList}
                            bordered={false}
                            style={{ height: '40px' }}
                          >
                            <div
                              className={styles.overText}
                              style={{ width: '93%', cursor: 'pointer' }}
                              onClick={() => {
                                this.props.dispatch(
                                  routerRedux.push(
                                    `/team/${team_name}/region/${region}/index`
                                  )
                                );
                              }}
                            >
                              <Tooltip title={team_alias}>{team_alias}</Tooltip>
                            </div>
                            <div>
                              <img
                                onClick={() => {
                                  this.props.dispatch(
                                    routerRedux.push(
                                      `/team/${team_name}/region/${region}/index`
                                    )
                                  );
                                }}
                                src={Arrow}
                                alt=""
                              />
                            </div>
                          </Card>
                        );
                      })}
                    </Col>
                  </Row>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>

            {this.state.adminer ? (
              <Col span={11}>
                <Card
                  bordered={false}
                  loading={overviewMonitorInfoLoading}
                  style={{ height: '243px' }}
                >
                  {overviewMonitorInfo && (
                    <Row>
                      <Col span={7}>
                        <ul className={styles.Box}>
                          <li>
                            <img src={Records} alt="" />
                          </li>
                          <li>
                            <Link
                              style={colors}
                              to={`/enterprise/${eid}/clusters`}
                            >
                              {overviewMonitorInfo.total_regions || 0}
                            </Link>
                          </li>
                          <li>
                            {/* 集群数量 */}
                            <FormattedMessage id="enterpriseOverview.overview.colony" />
                          </li>
                          <li>——</li>
                        </ul>
                      </Col>
                      <Col span={10}>
                        <ul className={styles.Box}>
                          <li>
                            <img src={Memory} alt="" />
                          </li>
                          <li>
                            <Tooltip
                              className={styles.cen}
                              title={
                                <FormattedMessage
                                  id="enterpriseOverview.overview.tooltip"
                                  values={{ num: memoryUsed, unit: memoryUsedUnit }}
                                />
                              }
                            // title={`${memoryUsed}${memoryUsedUnit} 包含各团队内存使用量、系统使用量和平台组件使用量`}
                            >
                              <span className={styles.numbers}>
                                {memoryUsed}
                                <span className={styles.units}>
                                  {memoryUsedUnit}
                                </span>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={`${memoryTotal} ${memoryTotalUnit}`}
                              className={styles.cen}
                            >
                              <span className={styles.numbers}>
                                /{memoryTotal}
                                <span className={styles.units}>
                                  {memoryTotalUnit}
                                </span>
                              </span>
                            </Tooltip>
                          </li>
                          <li>
                            {/* 内存使用量/总量 */}
                            <FormattedMessage id="enterpriseOverview.overview.memory" />
                          </li>
                          <li>——</li>
                        </ul>
                      </Col>
                      <Col span={7}>
                        <ul className={styles.Box}>
                          <li>
                            <img src={Cpus} alt="" />
                          </li>
                          <li>
                            <Tooltip
                              className={styles.cen}
                              title={`${cpuUsed}Core`}
                            >
                              <span className={styles.numbers}>
                                {cpuUsed}
                                <span className={styles.units}>Core</span>
                              </span>
                            </Tooltip>
                            <Tooltip
                              className={styles.cen}
                              title={`${cpuTotal}Core`}
                            >
                              <span className={styles.numbers}>
                                /{cpuTotal}
                                <span className={styles.units}>Core</span>
                              </span>
                            </Tooltip>
                          </li>
                          <li>
                            {/* CPU使用量/总量 */}
                            <FormattedMessage id="enterpriseOverview.overview.cpu" />
                          </li>
                          <li>——</li>
                        </ul>
                      </Col>
                    </Row>
                  )}
                </Card>
              </Col>
            ) : (
              <Col span={11}>
                <Card
                  bordered={false}
                  loading={collectionInfoLoading}
                  style={{ height: '243px' }}
                >
                  <Row style={{ marginBottom: '4px' }}>
                    <Col className={styles.grays} span={12}>
                      {/* 便捷入口 */}
                      <FormattedMessage id="enterpriseOverview.overview.entrance" />

                    </Col>
                    <Col
                      className={styles.grays}
                      style={{ textAlign: 'right' }}
                      span={12}
                    >
                      <span
                        style={{
                          marginRight: '10px',
                          color: '#3D54C4',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          this.onConvenientEntrance();
                        }}
                      >
                        {/* 新增 */}
                        <FormattedMessage id="enterpriseOverview.overview.add" />

                      </span>
                      {collections && (
                        <span
                          style={colors}
                          onClick={() => {
                            this.handleIsConvenientEntrance();
                          }}
                        >
                          {/* 编辑 */}
                          <FormattedMessage id="enterpriseOverview.overview.edit" />

                        </span>
                      )}
                    </Col>
                  </Row>

                  <Col span={24}>
                    <Row>
                      {collections ? (
                        collections.map((item, index) => {
                          const { url, name } = item;
                          const startPage = (page - 1) * page_size;

                          const totals = page * page_size;
                          if (page !== 1 && index < startPage) {
                            return null;
                          }
                          if (index >= totals) {
                            return null;
                          }
                          return (
                            <Col
                              span={12}
                              key={name}
                              onClick={() => {
                                editorConvenient
                                  ? this.deleteConvenient(item)
                                  : this.props.dispatch(routerRedux.push(url));
                              }}
                            >
                              <Card
                                bodyStyle={teamBoxList}
                                bordered={false}
                                style={{
                                  height: '40px',
                                  paddingRight: '10px'
                                }}
                              >
                                <div
                                  className={styles.overText}
                                  style={{
                                    width: '93%',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Tooltip title={name}>{name}</Tooltip>
                                </div>
                                <div>
                                  {editorConvenient ? (
                                    <Icon type="close" />
                                  ) : (
                                    <img src={Arrow} alt="" />
                                  )}
                                </div>
                              </Card>
                            </Col>
                          );
                        })
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </Row>

                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                      <Pagination
                        size="small"
                        current={page}
                        pageSize={page_size}
                        total={Number(total)}
                        onChange={this.onPageChangeCollectionView}
                      />
                    </div>
                  </Col>
                </Card>
              </Col>
            )}
          </Row>
        </div>