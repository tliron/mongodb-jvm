/**
 * Copyright 2010-2016 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.jline;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.SortedSet;
import java.util.TreeSet;

import jline.console.completer.Completer;

/**
 * A simple <a href="https://github.com/jline/jline2">JLine</a> completer that
 * matches a set of strings from the beginning of the buffer.
 * 
 * @author Tal Liron
 */
public class InitialCompleter implements Completer
{
	//
	// Construction
	//

	/**
	 * Constructor.
	 */
	public InitialCompleter()
	{
	}

	/**
	 * Constructor.
	 * 
	 * @param strings
	 *        The strings
	 */
	public InitialCompleter( final String... strings )
	{
		this( Arrays.asList( strings ) );
	}

	/**
	 * Constructor.
	 * 
	 * @param strings
	 *        The strings
	 */
	public InitialCompleter( final Collection<String> strings )
	{
		getStrings().addAll( strings );
	}

	//
	// Attributes
	//

	public SortedSet<String> getStrings()
	{
		return strings;
	}

	//
	// Completer
	//

	public int complete( final String buffer, final int cursor, final List<CharSequence> candidates )
	{
		if( buffer == null )
			candidates.addAll( getStrings() );
		else
		{
			for( String match : getStrings().tailSet( buffer ) )
			{
				if( !match.startsWith( buffer ) || buffer.equals( match ) )
					break;
				candidates.add( match );
			}
		}

		return candidates.isEmpty() ? -1 : 0;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final SortedSet<String> strings = new TreeSet<String>();
}
