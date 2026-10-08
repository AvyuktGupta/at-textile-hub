import type { Metadata } from "next";
import { AccountView } from "@/components/account/account-view";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <AccountView />
    </div>
  );
}
