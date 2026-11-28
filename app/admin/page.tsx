import { redirect } from "next/navigation";

// Easy-to-type entry for the admin: mkproductionlab.com/admin.
// Not linked anywhere on the public site. The middleware sends visitors who are not logged in to /login.
export default function Admin() {
  redirect("/orders");
}
