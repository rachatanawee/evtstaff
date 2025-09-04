'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl'
import { RefObject } from 'react'

interface EmployeeSearchFormProps {
  employeeId: string;
  setEmployeeId: (id: string) => void;
  handleSearch: () => void;
  isLoading: boolean;
  isSubmitting: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function EmployeeSearchForm({
  employeeId,
  setEmployeeId,
  handleSearch,
  isLoading,
  isSubmitting,
  inputRef,
}: EmployeeSearchFormProps) {
  const t = useTranslations('PrizePage');

  return (
    <div className="flex flex-col gap-3">
      <Input
        ref={inputRef} // Attach ref
        type="text"
        placeholder={t('employeeIdPlaceholder')}
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        disabled={isLoading || isSubmitting}
        className="flex-grow p-6 text-3xl border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder:text-2xl"
      />
      <div className="flex gap-3">
        <Button
          onClick={handleSearch}
          disabled={isLoading || !employeeId || isSubmitting}
          className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          {isLoading ? t('searching') : t('search')}
        </Button>
      </div>
    </div>
  )
}