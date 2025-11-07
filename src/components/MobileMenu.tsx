import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen, User, LogOut } from "lucide-react";

/**
 * MobileMenu Component
 * ---------------------
 * Visible only on mobile & tablet (hidden on lg and above).
 */
const MobileMenu = ({ t, handleSignOut }) => {
  const navigate = useNavigate();

  return (
    <div className="block lg:hidden">
      {/* `block lg:hidden` ensures visible on <1024px only */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-[#7b4dc4] hover:bg-[#895cd6]/10"
          >
            <Menu className="h-5 w-5 text-[#895cd6]" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-48 bg-white dark:bg-card shadow-lg rounded-lg"
        >
          
          
          <DropdownMenuItem onClick={() => navigate("/Dashboard")}>
            <BookOpen className="w-4 h-4 mr-2 text-[#895cd6]" />
            {t.myCourses}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/learning")}>
            <BookOpen className="w-4 h-4 mr-2 text-[#895cd6]" />
            {t.learning}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/Resources")}>
            <BookOpen className="w-4 h-4 mr-2 text-[#895cd6]" />
            {t.Resources}
          </DropdownMenuItem>


          <DropdownMenuItem onClick={() => navigate("/Resources")}>
            <BookOpen className="w-4 h-4 mr-2 text-[#895cd6]" />
            {t.Practices}
          </DropdownMenuItem>


          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="w-4 h-4 mr-2 text-[#895cd6]" />
            {t.myProfile}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2 text-red-500" />
            {t.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileMenu;
