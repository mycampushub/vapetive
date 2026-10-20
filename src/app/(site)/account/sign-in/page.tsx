import type { Metadata } from "next";
import { AccountPage } from "@/components/account/account-page";
import { SignInView } from "./sign-in-view";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Sign in",
  description: "Sign in to your Vapetive account to track orders, sync saved items and check out faster.",
};

export default function SignInPage() {
  return (
    <AccountPage title="Sign in" layout="center">
      <SignInView />
    </AccountPage>
  );
}
