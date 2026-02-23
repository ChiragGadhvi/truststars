'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

function FlippingProjectCard({ projects, startIndex = 0, flipKey }: { projects: any[], startIndex?: number, flipKey: number }) {
  if (!projects || projects.length === 0) return null;

  const index = (startIndex + flipKey) % projects.length;
  const project = projects[index];

  if (!project) return null;

  return (
    <div className="relative w-full h-[150px] perspective-[1000px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${project.id || project.name}-${flipKey}`}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-border/80 transition-colors cursor-pointer"
        >
          <Link href={`/repo/${project.owner}/${project.name}`} className="absolute inset-0 z-10" />
          
          <div className="flex items-start gap-4">
            {project.image_url ? (
              <div className="w-12 h-12 rounded-xl bg-muted relative overflow-hidden flex-shrink-0 border border-border/10">
                <Image src={project.image_url} alt={project.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-lg font-bold flex-shrink-0 border border-border/10">
                {project.name[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pr-2 pt-0.5">
              <h3 className="text-base font-semibold text-foreground truncate">{project.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 opacity-80 mt-0.5">{project.description || 'No description'}</p>
            </div>
          </div>

          <div className="flex items-end justify-between mt-4 px-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Stars</span>
              <span className="font-bold text-sm text-foreground/90">{project.stars?.toLocaleString() || 0}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Commits</span>
              <span className="font-bold text-sm text-foreground/90">{project.recent_commits_count || 0}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function GlobalSidebars() {
  const [repos, setRepos] = useState<any[]>([])
  const [flipKey, setFlipKey] = useState(0)

  // Master flip interval - 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFlipKey((prev) => prev + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchRepos = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('repositories')
        .select(`
          *,
          user_repositories(
            users(github_username, avatar_url)
          )
        `)
        .order('activity_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)
      
      setRepos(data || [])
    }
    fetchRepos()
  }, [])

  if (repos.length === 0) return null

  return (
    <>
      <div className="hidden xl:flex flex-col gap-4 w-[280px] fixed top-6 bottom-6 left-6 overflow-hidden opacity-90 z-40 pr-2">
         <FlippingProjectCard projects={repos} startIndex={0} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={1} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={2} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={3} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={4} flipKey={flipKey} />
      </div>

      <div className="hidden xl:flex flex-col gap-4 w-[280px] fixed top-6 bottom-6 right-6 overflow-hidden opacity-90 z-40 pl-2">
         <FlippingProjectCard projects={repos} startIndex={5} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={6} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={7} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={8} flipKey={flipKey} />
         <FlippingProjectCard projects={repos} startIndex={9} flipKey={flipKey} />
      </div>
    </>
  )
}
