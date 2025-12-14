import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface WikiNavbarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const WikiNavbar = ({
  mobileMenuOpen,
  setMobileMenuOpen,
}: WikiNavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="https://s3.regru.cloud/img.devilrust/devilrust_logo.png"
                alt="DevilRust Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h2
                  className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontStyle: "italic",
                  }}
                >
                  DevilRust
                </h2>
                <p className="text-xs text-muted-foreground">Wiki</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" className="bg-primary/10">
                <Icon name="Home" size={16} className="mr-2" />
                Wiki
              </Button>
              <Link to="/guides">
                <Button variant="ghost" size="sm">
                  <Icon name="BookOpen" size={16} className="mr-2" />
                  Гайды
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={20} />
            </Button>
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90 hidden sm:flex"
              onClick={() => window.open("https://play.devilrust.ru", "_blank")}
            >
              <Icon name="ExternalLink" size={16} className="mr-2" />
              Сайт
            </Button>
          </div>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="w-full justify-start bg-primary/10">
              <Icon name="Home" size={16} className="mr-2" />
              Wiki
            </Button>
            <Link to="/guides" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Icon name="BookOpen" size={16} className="mr-2" />
                Гайды
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start bg-primary hover:bg-primary/90"
              onClick={() => {
                window.open("https://play.devilrust.ru", "_blank");
                setMobileMenuOpen(false);
              }}
            >
              <Icon name="ExternalLink" size={16} className="mr-2" />
              Сайт
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default WikiNavbar;