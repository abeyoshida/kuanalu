'use client';

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search } from "lucide-react";
import { getOrganizationMembers } from "@/lib/actions/organization-actions";

interface User {
  userId: number;
  name: string;
  email: string;
}

interface UserSearchProps {
  organizationId: number;
  onUserSelected: (userId: number) => void;
  placeholder?: string;
  className?: string;
}

export function UserSearch({ organizationId, onUserSelected, placeholder = "Search users...", className = "" }: UserSearchProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const members = await getOrganizationMembers(organizationId);
        // Convert organization members to User format
        const usersList: User[] = members.map(member => ({
          userId: member.userId,
          name: member.name,
          email: member.email
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [organizationId]);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={`relative ${className}`}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder={placeholder}
            className="pl-9"
            onClick={() => setOpen(true)}
            readOnly
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5} style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput 
            placeholder="Search users..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">Loading users...</div>
          ) : (
            <>
              <CommandEmpty>No users found</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map(user => (
                  <CommandItem
                    key={user.userId}
                    onSelect={() => {
                      onUserSelected(user.userId);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
} 