import React, { FormEvent } from "react";
import Link from "next/link";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/24/solid';

type Props = {
  currentPage: number;
  totalPages: number;
  handlePaginationClick: (e: FormEvent, newPage: number) => void;
};

function Pagination({ currentPage, totalPages, handlePaginationClick }: Props) {
  return (
    <div className="py-3 pl-1 flex justify-center">
      {currentPage > 1 && (
        <Link href="/">
          <a
            className="mr-3 inline-block"
            onClick={(e) => handlePaginationClick(e, currentPage - 1)}
          >
            <ArrowLongLeftIcon className="w-[50px] h-100">
              Prev
            </ArrowLongLeftIcon>
          </a>
        </Link>
      )}
      {totalPages > currentPage && (
        <Link href="/">
          <a
            className="inline-block"
            onClick={(e) => handlePaginationClick(e, currentPage + 1)}
          >
            <ArrowLongRightIcon className="w-[50px] h-100">
              Next
            </ArrowLongRightIcon>
          </a>
        </Link>
      )}
    </div>
  );
}

export default Pagination;
