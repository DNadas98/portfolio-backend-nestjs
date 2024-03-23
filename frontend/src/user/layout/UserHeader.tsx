import {AppBar, Box, Toolbar, useMediaQuery, useTheme} from "@mui/material";
import {IMenuRoutes} from "../../common/routing/IMenuRoutes.ts";
import {userMenuProfileRoutes} from "../../common/config/menu/userMenuProfileRoutes.tsx";
import MenuUserSmall from "../../common/utils/components/MenuUserSmall.tsx";
import {userMenuRoutes} from "../../common/config/menu/userMenuRoutes.tsx";
import MenuSmall from "../../common/utils/components/MenuSmall.tsx";
import MenuLarge from "../../common/utils/components/MenuLarge.tsx";
import SiteLogo from "../../common/utils/components/SiteLogo.tsx";

export default function UserHeader() {
  const menu: IMenuRoutes = userMenuProfileRoutes;
  const publicMenu: IMenuRoutes = userMenuRoutes;
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar position="static"
            variant={"elevation"} elevation={0}
            sx={{
              boxShadow: `0 1px 10px ${theme.palette.background.default}`
            }}>
      <Toolbar>
        <SiteLogo/>
        <Box flexGrow={1}/>
        {isSmallScreen
          ? <MenuSmall menu={publicMenu}/>
          : <MenuLarge menu={publicMenu}/>
        }
        <MenuUserSmall menu={menu}/>
      </Toolbar>
    </AppBar>
  );
}
