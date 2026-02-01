import { LoginForm } from "@/components/auth"

export default function LoginPage() {
  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
