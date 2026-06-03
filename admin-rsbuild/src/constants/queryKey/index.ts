import * as asset from './asset';
import * as fileAccessConfig from './fileAccessConfig';
import * as gitlab from './gitlab';
import * as mcpConfig from './mcpConfig';
import * as systemPolicy from './systemPolicy';
import * as systemMessage from './systemMessage';
import * as passport from './passport';
import * as permissionGroup from './permissionGroup';
import * as position from './position';
import * as project from './project';
import * as qywork from './qywork';
import * as role from './role';
import * as tenant from './tenant';
import * as todo from './todo';
import * as user from './user';

const queryKey = {
  asset,
  fileAccessConfig,
  gitlab,
  mcpConfig,
  passport,
  permissionGroup,
  position,
  systemPolicy,
  systemMessage,
  project,
  qywork,
  role,
  tenant,
  todo,
  user,
};

export default queryKey;
