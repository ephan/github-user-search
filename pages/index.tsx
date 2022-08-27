import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { format } from "path";
import { FormEvent, useState, useEffect } from "react";
import { Octokit } from "@octokit/rest";
import Link from "next/link";
import UserCard from "../components/UserCard";

type FormData = {
  searchText: string;
};

const RESULTS_PER_PAGE = 5;

const Home: NextPage = () => {
  const [form, setForm] = useState<FormData>({ searchText: "" });
  const [results, setResults] = useState<Array<ResultData>>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (form?.searchText !== "") getData(form?.searchText);
  }, [currentPage]);

  const getData = (searchText: string) => {
    const retrievedData = window.localStorage.getItem(
      JSON.stringify({ search: searchText, page: currentPage })
    );
    if (retrievedData) {
      setResults(JSON.parse(retrievedData));
      setTotalPages(
        parseInt(
          window.localStorage.getItem(
            JSON.stringify({
              search: searchText,
              page: currentPage,
              getTotalPages: 1,
            })
          ) || "1"
        )
      );
      return;
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_SECRET,
    });

    // '/search/users' API returns up to 30 results at a time, but we specify the RESULTS_PER_PAGE
    // this api only returns partial list of user data, we need a 2nd api call
    const data = octokit
      .request("GET /search/users", {
        q: searchText,
        page: currentPage,
        per_page: RESULTS_PER_PAGE,
      })
      .then((data) => {
        if (data?.data?.items) {
          const computedTotalPages =
            Math.floor((data?.data?.total_count || 0) / RESULTS_PER_PAGE) + 1;
          setTotalPages(computedTotalPages);

          //call second api for each user returned
          const urls = data?.data?.items.map(
            (user) => `https://api.github.com/users/${user.login}`
          );

          //Promise.all ensures we get results all at once
          Promise.all(urls.map((u) => fetch(u)))
            .then((responses) =>
              Promise.all(responses.map((res) => res.json())).catch(
                (err) => console.log
              )
            )
            .then((jsonData) => {
              if (jsonData && Array.isArray(jsonData)) {
                setResults(jsonData);
                //cache results
                window.localStorage.setItem(
                  JSON.stringify({ search: searchText, page: currentPage }),
                  JSON.stringify(jsonData)
                );
                window.localStorage.setItem(
                  JSON.stringify({
                    search: searchText,
                    page: currentPage,
                    getTotalPages: 1,
                  }),
                  computedTotalPages.toString()
                );
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    //reset current page
    setCurrentPage(1);
    if (form?.searchText) getData(form?.searchText);
  };

  const handlePaginationClick = (e: FormEvent, newPage: number) => {
    e.preventDefault();
    setCurrentPage(newPage);
  };

  return (
    <div className="my-7 mx-auto max-w-5xl">
      <Head>
        <title>Github Search App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Search */}
      <main className="sticky top-0 z-50 flex bg-white px-0 py-2 shadow-sm">
        <form className="w-full" onSubmit={(e) => handleSubmit(e)}>
          <input
            type="text"
            className="border rounded p-1 grow shrink-0 w-[50%] hover:shadow"
            placeholder="Search name, email address, username, etc..."
            value={form.searchText}
            onChange={(e) => setForm({ ...form, searchText: e.target.value })}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded px-5 py-1 ml-1"
          >
            Search
          </button>
        </form>
      </main>

      {/* Results */}
      <div className="flex flex-wrap">
        {results?.map((user) => (
          <UserCard user={user} key={user.login} />
        ))}
      </div>
      {/* Pagination */}
      <div>
        {currentPage > 1 && (
          <Link href="/">
            <a
              className="pr-5"
              onClick={(e) => handlePaginationClick(e, currentPage - 1)}
            >
              Prev
            </a>
          </Link>
        )}
        {totalPages > currentPage && (
          <Link href="/">
            <a onClick={(e) => handlePaginationClick(e, currentPage + 1)}>
              Next
            </a>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async () => {
  //no data to pre-render
  return {
    props: {},
  };
};
