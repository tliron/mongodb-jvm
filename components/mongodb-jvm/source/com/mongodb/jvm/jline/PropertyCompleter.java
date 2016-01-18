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
import java.util.List;

import jline.console.completer.Completer;

/**
 * A <a href="https://github.com/jline/jline2">JLine</a> completer that
 * recognizes the dot notation used in C-like and other languages (including
 * Java, JavaScript, and Python).
 * 
 * @author Tal Liron
 */
public abstract class PropertyCompleter implements Completer
{
	//
	// Operations
	//

	/**
	 * Gets the candidates for a value.
	 * 
	 * @param value
	 *        The value
	 * @return The candidates
	 */
	public abstract String[] getCandidatesFor( String value );

	//
	// Completer
	//

	public int complete( final String buffer, final int cursor, final List<CharSequence> candidates )
	{
		if( cursor > 0 )
		{
			for( int dot = cursor - 1; dot >= 0; dot-- )
			{
				char c = buffer.charAt( dot );

				if( !isCode( c ) )
					break;

				if( c == '.' )
				{
					int start = 0;
					if( dot > 0 )
					{
						for( start = dot - 1; start >= 0; start-- )
						{
							char c2 = buffer.charAt( start );
							if( !isCode( c2 ) )
							{
								start++;
								break;
							}
						}
						if( start == -1 )
							start = 0;
					}

					String value = buffer.substring( start, dot );
					String current = buffer.substring( dot + 1, cursor );
					String[] matches = getCandidatesFor( value );
					if( current.isEmpty() )
						candidates.addAll( Arrays.asList( matches ) );
					else
					{
						for( String match : matches )
						{
							if( !match.startsWith( current ) )
								continue;
							candidates.add( match );
						}
					}

					return candidates.isEmpty() ? -1 : dot + 1;
				}
			}
		}

		return -1;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static boolean isCode( char c )
	{
		return Character.isJavaIdentifierPart( c ) || ( c == '.' );
	}
}
