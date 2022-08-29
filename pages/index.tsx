import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { format } from "path";
import { FormEvent, useState, useEffect } from "react";
import { Octokit } from "@octokit/rest";
import UserCard from "../components/UserCard";
import Pagination from "../components/Pagination";

type FormData = {
  searchText: string;
  sort: string;
};

const RESULTS_PER_PAGE = 9;

const Home: NextPage = () => {
  const [form, setForm] = useState<FormData>({ searchText: "", sort: "" });
  const [results, setResults] = useState<Array<ResultData>>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [noResults, setNoResults] = useState(false);

  // monitor currentPage and requery if currentPage changes
  useEffect(() => {
    if (form?.searchText !== "") getData(form?.searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // monitor noResults and reset results and pagination if noResults is true
  useEffect(() => {
    if (noResults) {
      setResults([]); // reset results
      setTotalPages(0); //removes pagination next links
    }
  }, [noResults]);

  const getData = async (searchText: string) => {
    //check to see if the {form, currentPage} key exists in localStorage
    const retrievedData = localStorage.getItem(
      JSON.stringify({ search: form, page: currentPage })
    );

    //the key exists, but could be empty
    if (retrievedData) {
      const parsedData = JSON.parse(retrievedData);

      setResults(parsedData?.data || []);
      setTotalPages(parsedData?.totalPages || 1);

      if (!parsedData?.data?.length) setNoResults(true);
      else setNoResults(false);
      return;
    }

    try {
      //split form.sort "sort order" into two arrays
      const [sortBy, sortOrder] = form.sort.split(" ");

      let fetchData = await fetch(`/api/githubUsers?q=${searchText}&page=${currentPage}&per_page=${RESULTS_PER_PAGE}&sort=${sortBy}&order=${sortOrder}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => await res.json());; 

      const userData = fetchData.data;
      const computedTotalPages = fetchData.totalPages;

      if (userData && Array.isArray(userData)) {
        setResults(userData);
        setTotalPages(computedTotalPages);

        //cache results - I'm caching both the data and the number of pages
        //key : { search: form, page: currentPage }
        //value : { data: userData, totalPages: computedTotalPages }
        localStorage.setItem(
          JSON.stringify({ search: form, page: currentPage }),
          JSON.stringify({
            data: userData,
            totalPages: computedTotalPages,
          })
        );
        
        if (userData.length === 0) setNoResults(true);
        else setNoResults(false);
      }
    } catch (error) {
      setTotalPages(0); //removes pagination next links
      alert(error);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    //reset current page
    setCurrentPage(1);
    if (form?.searchText) getData(form?.searchText);
  };

  const handlePaginationClick = (e: FormEvent, newPage: number) => {
    e.preventDefault();
    setCurrentPage(newPage); //useEffect will be triggered
  };

  return (
    <div className="my-7 mx-auto max-w-5xl">
      <Head>
        <title>Github Search App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Search */}
      <main className="sticky top-0 z-50 bg-white px-0 py-2 shadow-sm">
        <form
          className="lg:pl-1 sm:pl-0 flex flex-wrap"
          onSubmit={(e) => handleSubmit(e)}
        >
          <input
            type="text"
            className="border rounded p-1 lg:grow-1 lg:shrink-0 hover:shadow lg:basis-[50%] sm:basis-[100%] lg:w-[50%] w-full"
            placeholder="Search name, email address, username, etc..."
            value={form.searchText}
            required
            onChange={(e) => setForm({ ...form, searchText: e.target.value })}
          />

          <div className="lg:basis-[48%] sm:basis-[100%]">
            <select
              className="border lg:ml-1 p-1 shrink-0 grow-1  sm:basis-[50%] sm:y-3"
              onChange={(e) => setForm({ ...form, sort: e.target.value })}
            >
              <option value="">Sort By</option>
              <option value="followers asc">Followers Ascending</option>
              <option value="followers desc">Followers Descending</option>
              <option value="repositories asc">Repositories Ascending</option>
              <option value="repositories desc">Repositories Descending</option>
              <option value="joined asc">Date Joined Ascending</option>
              <option value="joined desc">Date Joined Descending</option>
            </select>

            <button
              type="submit"
              className="bg-blue-500 text-white rounded px-5 py-1 ml-1  sm:basis-[50%] sm:y-3 self-end"
            >
              Search
            </button>
          </div>
        </form>
      </main>

      {/* Results */}
      <div className="flex flex-wrap justify-center">
        {noResults === true && (
          <div className="justify-center">There are no results ...</div>
        )}
        {results?.map((user) => (
          <UserCard user={user} key={user.login} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        handlePaginationClick={handlePaginationClick}
      />
    </div>
  );
};

export default Home;
