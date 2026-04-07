"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { ChevronDown, ChevronUp, Menu, User, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  publicUserMenuItems,
  adminMenuItems,
  employeeMenuItems,
  superAdminMenuItems,
  agencyMenuItems,
  type MenuItemProps,
} from "@/constants/protected-menu"
import type { RootState } from "@/redux/store"
import { toggleMenu } from "@/redux/slices/menuSlice"
import ImprovedFooter from "@/components/improved-footer"
import { useCurrentUser } from "@/hooks/use-current-user"

type Role = "user" | "admin" | "staff" | "superadmin" | "agency"

interface DashboardConfig {
  title: string
  items: MenuItemProps[]
}

const DASHBOARD_CONFIG: Record<Role, DashboardConfig> = {
  user: { title: "User Dashboard", items: publicUserMenuItems },
  admin: { title: "Admin Portal", items: adminMenuItems },
  staff: { title: "Staff Portal", items: employeeMenuItems },
  superadmin: { title: "Super Admin Portal", items: superAdminMenuItems },
  agency: { title: "Agency Portal", items: agencyMenuItems },
}

function isActivePath(pathname: string, link?: string): boolean {
  if (!link || link === "#") return false
  return pathname === link || pathname.startsWith(link + "/")
}

/* ===========================
   Menu Item Component
=========================== */
function MenuItem({
  item,
  pathname,
  level = 0,
}: {
  item: MenuItemProps
  pathname: string
  level?: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  const isActive = isActivePath(pathname, item.menuItemLink)

  const hasActiveChild =
    item.subMenuItems?.some(
      (sub) =>
        isActivePath(pathname, sub.menuItemLink) ||
        sub.subMenuItems?.some((subSub) =>
          isActivePath(pathname, subSub.menuItemLink)
        )
    ) || false

  useEffect(() => {
    if (hasActiveChild) setIsOpen(true)
  }, [hasActiveChild])

  const toggleSubMenu = () => setIsOpen(!isOpen)

  return (
    <div className="mb-1">
      <Button
        variant="ghost"
        onClick={item.submenu ? toggleSubMenu : undefined}
        className={cn(
          "w-full justify-start px-4 py-2 text-sm rounded-none transition-colors",
          "hover:bg-blue-50 hover:text-blue-800",
          isActive &&
            "bg-blue-100 text-blue-900 font-semibold border-l-4 border-blue-700",
          level > 0 && "pl-8"
        )}
      >
        <Link
          href={item.menuItemLink || "#"}
          className="flex items-center w-full gap-2 text-left"
          onClick={(e) => item.submenu && e.preventDefault()}
        >
          {item.Icon && (
            <item.Icon
              className={cn(
                "w-4 h-4",
                isActive ? "text-blue-700" : (item.color || "text-gray-600")
              )}
            />
          )}

          <span className="flex-1">{item.menuItemText}</span>

          {item.submenu &&
            (isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ))}
        </Link>
      </Button>

      {item.submenu && isOpen && (
        <div className="ml-4 border-l border-gray-200 pl-3 mt-1">
          {item.subMenuItems.map((subItem) => (
            <MenuItem
              key={subItem.menuItemText}
              item={subItem}
              pathname={pathname}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ===========================
   Sidebar Content
=========================== */
function SidebarContent({
  role,
  pathname,
  onClose,
}: {
  role: Role
  pathname: string
  onClose?: () => void
}) {
  const config = DASHBOARD_CONFIG[role]
  const user = useCurrentUser()

  // Filter items recursively based on gpwise menu controls
  // Superadmin bypasses this filter entirely
  const filterMenuItems = (items: MenuItemProps[], enforceCheck = true): MenuItemProps[] => {
    if (!user || user.role === "superadmin") return items
    
    // Default allowed if we don't have strict menu controls
    // If you want strict opt-in, change this logic.
    const allowedMenus = user.menuControls || []
    
    // If no menuControls defined and they are not superadmin, perhaps they see default
    // or maybe they see nothing unless explicitly defined?
    // Based on requirement, it's opt-in:
    if (allowedMenus.length === 0 && (role === "admin" || role === "staff")) {
      return items; // Fallback so we don't accidentally hide everything if no menus configured yet
    }

    return items
      .map(item => {
        // Check if the menu item is allowed. If enforceCheck is false (e.g. for children of an allowed parent), we allow it automatically.
        const isAllowed = enforceCheck && (role === "admin" || role === "staff") ? allowedMenus.includes(item.menuItemText) : true;
        
        // If parent is not permitted but it's an admin/staff with populated menu controls, we hide it 
        // We only enforce filtering if it's admin or staff.
        if (!isAllowed && allowedMenus.length > 0) return null;

        // Clone and filter children structure
        // Since parent is allowed, bypass enforceCheck for its children so they are displayed correctly
        return {
          ...item,
          subMenuItems: item.submenu ? filterMenuItems(item.subMenuItems, false) : []
        }
      })
      .filter(Boolean) as MenuItemProps[]
  }

  const filteredItems = filterMenuItems(config.items)

  return (
    <div className="w-72 h-screen flex flex-col bg-white border-r border-gray-300 fixed left-0 top-0 z-30">
      {/* Header */}
      <header className="h-16 bg-blue-700 border-b border-gray-300 px-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-white">
            {config.title}
          </h1>
          <span className="text-xs text-blue-100">
            Government Management System
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border border-white">
            <AvatarFallback className="bg-white text-blue-700 text-xs">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-blue-600"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {filteredItems.map((item) => (
            <MenuItem
              key={item.menuItemText}
              item={item}
              pathname={pathname}
            />
          ))}
        </nav>
      </ScrollArea>

      
      
    </div>
  )
}

/* ===========================
   Main Export
=========================== */
export default function UnifiedSidebar({
  role = "user",
}: {
  role?: Role
}) {
  const isMenuOpen = useSelector((state: RootState) => state.menu.isOpen)
  const dispatch = useDispatch()
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const handleToggle = () => {
    dispatch(toggleMenu())
    setIsMobileOpen(!isMobileOpen)
  }

  const handleClose = () => {
    setIsMobileOpen(false)
    dispatch(toggleMenu())
  }

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggle}
              className="fixed top-4 left-4 z-50 bg-white border border-gray-300 rounded-md w-10 h-10 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="p-0 w-[280px] bg-white border-r border-gray-300"
          >
            <SidebarContent
              role={role}
              pathname={pathname}
              onClose={handleClose}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <SidebarContent role={role} pathname={pathname} />
      </div>
    </>
  )
}
